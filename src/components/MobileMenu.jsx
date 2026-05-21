import { useState } from 'react';
import Ic from './Ic';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ onExportBackup, onImportBackup, onOpenSettings, onLogout, syncing, hidden }) {
  const [open, setOpen] = useState(false);

  function handle(fn) {
    setOpen(false);
    fn();
  }

  if (hidden) return null;

  return (
    <>
      {/* Cabeçalho mobile */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="30" height="30" viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
            <rect width="64" height="64" rx="16" fill="oklch(65% 0.19 38)"/>
            <path d="M6 56 L6 40 L14 40 L14 26 L20 26 L20 36 L28 36 L28 20 L34 20 L34 30 L44 30 L44 14 L50 14 L50 26 L58 26 L58 56 Z" fill="white"/>
          </svg>
          <span className={styles.logoText}>FabricaLog</span>
          {syncing && <span style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 700 }}>↑</span>}
        </div>
        <button className={styles.menuBtn} onClick={() => setOpen(true)}>
          <Ic name="more" size={20} />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <button className={styles.sheetItem} onClick={() => handle(onExportBackup)}>
              <Ic name="download" size={18} />
              <span>Exportar Backup</span>
            </button>
            <button className={styles.sheetItem} onClick={() => handle(onImportBackup)}>
              <Ic name="upload" size={18} />
              <span>Restaurar Backup</span>
            </button>
            <button className={styles.sheetItem} onClick={() => handle(onOpenSettings)}>
              <Ic name="settings" size={18} />
              <span>Configurações</span>
            </button>
            <button className={styles.sheetItem} onClick={() => handle(onLogout)}>
              <Ic name="x" size={18} />
              <span>Sair</span>
            </button>
            <button className={styles.sheetCancel} onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
