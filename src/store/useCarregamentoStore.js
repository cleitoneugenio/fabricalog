import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';
import { now } from '../utils/syncMerge';

export function useCarregamentoStore() {
  const [items, setItems] = useState(() => storage.load('carregamentos', []));
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    storage.save('carregamentos', items);
  }, [items]);

  function create(partial) {
    const item = { id: crypto.randomUUID(), ...partial, updatedAt: now() };
    setItems(prev => [...prev, item]);
    return item.id;
  }

  function update(id, patch) {
    setItems(prev => prev.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x));
  }

  function remove(id) {
    setItems(prev => prev.filter(x => x.id !== id));
  }

  function replaceAll(newItems) {
    setItems(newItems.map(x => ({ ...x })));
  }

  function byDate(data) {
    return items
      .filter(x => x.data === data)
      .sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''));
  }

  return { items, create, update, remove, replaceAll, byDate };
}
