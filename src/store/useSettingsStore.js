import { useState, useEffect, useRef } from 'react';
import { storage } from './storage';

const DEFAULTS = {
  empresa:  'GF MUNIZ ARTEFACTOS DE CERAMICA EIRELI',
  cnpj:     '12.509.424/0001-65',
  endereco: 'Bela Cruz - CE, ROD CE 179 - KM 12 - S/N - Zona Rural',
  cidade:   'Bela Cruz',
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
