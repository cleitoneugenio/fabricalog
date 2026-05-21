import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';
import { now } from '../utils/syncMerge';

const EMPTY_DIA = () => ({
  queima: '', enfornas: ['', '', ''], qualidade: 'Pátio Seco',
  estoque: '', vendas: '', fornosDesocupados: '',
  reforma: '', qtdFunc: '', ocorrencia: '',
});

export function buildEmptyDias() {
  return Array.from({ length: 6 }, EMPTY_DIA);
}

export function useSemanaStore() {
  const [items, setItems] = useState(() => storage.load('semanas', []));
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    storage.save('semanas', items);
  }, [items]);

  function create(partial) {
    const semana = {
      id: crypto.randomUUID(),
      numero: partial.numero,
      dataInicio: partial.dataInicio,
      meta: partial.meta ?? 10,
      dias: partial.dias ?? buildEmptyDias(),
      updatedAt: now(),
    };
    setItems(prev => [...prev, semana]);
    return semana.id;
  }

  function update(id, patch) {
    setItems(prev => prev.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x));
  }

  function updateDia(id, diaIndex, patch) {
    setItems(prev => prev.map(x => {
      if (x.id !== id) return x;
      const dias = x.dias.map((d, i) => i === diaIndex ? { ...d, ...patch } : d);
      return { ...x, dias, updatedAt: now() };
    }));
  }

  function remove(id) {
    setItems(prev => prev.filter(x => x.id !== id));
  }

  function replaceAll(newItems) {
    setItems(newItems.map(x => ({ ...x })));
  }

  function getById(id) {
    return items.find(x => x.id === id);
  }

  return { items, create, update, updateDia, remove, replaceAll, getById };
}
