import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';

const ALL_CHAMBERS = [
  'F1','F2','F3','F4','F5','F6','F7','F8','F9',
  'F10','F11','F12','F13','F14','F15','F16','F17','F18',
];

const VALID_STATUS = ['vazio', 'carregado', 'queimando', 'descarregando'];

const EMPTY_CHAMBER = { status: 'vazio', restante: null };

const INITIAL = Object.fromEntries(ALL_CHAMBERS.map(id => [id, { ...EMPTY_CHAMBER }]));

function migrate(saved) {
  const result = {};
  for (const id of ALL_CHAMBERS) {
    const v = saved[id];
    if (!v) {
      result[id] = { ...EMPTY_CHAMBER };
    } else if (typeof v === 'string') {
      // formato antigo — converte
      const status = VALID_STATUS.includes(v) ? v : 'vazio';
      result[id] = { status, restante: null };
    } else if (typeof v === 'object' && VALID_STATUS.includes(v.status)) {
      result[id] = { status: v.status, restante: v.restante ?? null };
    } else {
      result[id] = { ...EMPTY_CHAMBER };
    }
  }
  return result;
}

export function useFornoStore() {
  const [chambers, setChambers] = useState(() =>
    migrate(storage.load('forno', {}))
  );
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    storage.save('forno', chambers);
  }, [chambers]);

  function setStatus(id, status) {
    setChambers(prev => ({
      ...prev,
      [id]: { status, restante: status === 'descarregando' ? (prev[id]?.restante ?? null) : null },
    }));
  }

  function setRestante(id, value) {
    const n = value === '' ? null : Number(value);
    setChambers(prev => ({
      ...prev,
      [id]: { ...prev[id], restante: n },
    }));
  }

  function concluirDescarga(id) {
    setChambers(prev => ({
      ...prev,
      [id]: { status: 'vazio', restante: null },
    }));
  }

  function resetAll() {
    setChambers({ ...INITIAL });
  }

  function replaceAll(data) {
    if (data && typeof data === 'object') setChambers(migrate(data));
  }

  return { chambers, setStatus, setRestante, concluirDescarga, resetAll, replaceAll };
}
