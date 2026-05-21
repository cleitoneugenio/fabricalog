import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';
import { EMPLOYEES as INITIAL } from '../data/employees';

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
    setEmployees(prev => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
  }

  function rename(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, name: trimmed } : e));
  }

  function remove(id) {
    setEmployees(prev => prev.filter(e => e.id !== id));
  }

  function replaceAll(newEmployees) {
    setEmployees(newEmployees.map(e => ({ ...e })));
  }

  return { employees, add, rename, remove, replaceAll };
}
