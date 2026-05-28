import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';
import { EMPLOYEES as INITIAL } from '../data/employees';
import { now } from '../utils/syncMerge';

export function useEmployeeStore() {
  const [employees, setEmployees] = useState(() => {
    const stored = storage.load('employees', null);
    return stored ?? INITIAL;
  });
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    storage.save('employees', employees);
  }, [employees]);

  function add(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setEmployees(prev => [...prev, { id: crypto.randomUUID(), name: trimmed, updatedAt: now() }]);
  }

  function rename(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, name: trimmed, updatedAt: now() } : e));
  }

  function remove(id) {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ativo: false, updatedAt: now() } : e));
  }

  function reactivate(id) {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ativo: true, updatedAt: now() } : e));
  }

  function replaceAll(newEmployees) {
    setEmployees(newEmployees.map(e => ({ ...e })));
  }

  const activeEmployees = employees.filter(e => e.ativo !== false);

  return { employees, activeEmployees, add, rename, remove, reactivate, replaceAll };
}
