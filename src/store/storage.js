const PREFIX = 'fabricalog_v1_';
const timers = {};

export const storage = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw != null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  save(key, value) {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(() => {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch (e) {
        if (import.meta.env.DEV) console.warn('storage.save failed', e);
      }
    }, 400);
  },
  // Flush síncrono — cancela o debounce pendente e escreve imediatamente
  saveNow(key, value) {
    clearTimeout(timers[key]);
    delete timers[key];
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      if (import.meta.env.DEV) console.warn('storage.saveNow failed', e);
    }
  },
  clear(key) {
    localStorage.removeItem(PREFIX + key);
  },
};
