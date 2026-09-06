import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';

const DEFAULTS = {
  empresa:  'Cerâmica Demonstração Ltda',
  cnpj:     '00.000.000/0001-00',
  endereco: 'Rua Exemplo, 100 - Zona Rural',
  cidade:   'Cidade Exemplo',
};

export function useSettingsStore() {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULTS,
    ...storage.load('settings', {}),
  }));
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    storage.save('settings', settings);
  }, [settings]);

  function update(patch) {
    setSettings(prev => ({ ...prev, ...patch }));
  }

  function reset() {
    setSettings({});
  }

  return { settings, update, reset };
}
