import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './LoginScreen.module.css';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email ou senha incorretos.');
      setLoading(false);
    } else {
      onLogin();
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="16" fill="oklch(65% 0.19 38)"/>
            <path d="M6 56 L6 40 L14 40 L14 26 L20 26 L20 36 L28 36 L28 20 L34 20 L34 30 L44 30 L44 14 L50 14 L50 26 L58 26 L58 56 Z" fill="white"/>
          </svg>
          <span className={styles.logoText}>FabricaLog</span>
        </div>

        <p className={styles.sub}>Forno CEDAN · Controle de Produção</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Senha</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
