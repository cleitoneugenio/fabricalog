import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';

const DEFAULTS = {
  empresa:  '***REMOVED***',
  cnpj:     '***REMOVED***',
  endereco: '***REMOVED***',
  cidade:   '***REMOVED***',
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

  return { settings, update };
}
