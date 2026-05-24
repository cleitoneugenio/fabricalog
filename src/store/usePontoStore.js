import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';
import { now } from '../utils/syncMerge';

function buildEmptyDias(employees) {
  const dias = {};
  for (const emp of employees) {
    dias[emp.id] = { seg: '', ter: '', qua: '', qui: '', sex: '', sab: '' };
  }
  return dias;
}

export function usePontoStore() {
  const [items, setItems] = useState(() => storage.load('pontos', []));
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    storage.save('pontos', items);
  }, [items]);

  function create(partial, employees) {
    const ponto = {
      id: crypto.randomUUID(),
      numero: partial.numero,
      dataInicio: partial.dataInicio,
      dias: partial.dias ?? buildEmptyDias(employees ?? []),
      updatedAt: now(),
    };
    setItems(prev => [...prev, ponto]);
    return ponto.id;
  }

  function updateCell(id, empId, dayKey, value, nota) {
    setItems(prev => prev.map(x => {
      if (x.id !== id) return x;
      const empDia = { ...x.dias[empId], [dayKey]: value };
      const notaKey = dayKey + '_nota';
      if (nota !== undefined) {
        if (nota) empDia[notaKey] = nota;
        else delete empDia[notaKey];
      }
      return { ...x, dias: { ...x.dias, [empId]: empDia }, updatedAt: now() };
    }));
  }

  function update(id, patch) {
    setItems(prev => prev.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x));
  }

  function remove(id) {
    setItems(prev => prev.filter(x => x.id !== id));
  }

  function updateBonusValor(id, empId, valor) {
    setItems(prev => prev.map(x => {
      if (x.id !== id) return x;
      const empDia = { ...x.dias[empId] };
      if (valor == null || valor === '') delete empDia.bonus_valor;
      else empDia.bonus_valor = Number(valor);
      return { ...x, dias: { ...x.dias, [empId]: empDia }, updatedAt: now() };
    }));
  }

  function replaceAll(newItems) {
    setItems(newItems.map(x => ({ ...x })));
  }

  function getById(id) {
    return items.find(x => x.id === id);
  }

  return { items, create, update, updateCell, updateBonusValor, remove, replaceAll, getById };
}
