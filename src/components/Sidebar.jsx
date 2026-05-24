import Ic from './Ic';
import FornoToggle from './FornoToggle';
import styles from './Sidebar.module.css';

const ITEMS = [
  { key: 'dash',   label: 'Dashboard',     icon: 'chart-bar' },
  { key: 'semana', label: 'Produção',      icon: 'production' },
  { key: 'carga',  label: 'Carregamentos', icon: 'truck' },
  { key: 'ponto',  label: 'Ponto',         icon: 'users' },
  { key: 'camara', label: 'Calculadora',   icon: 'camara' },
  { key: 'equipe', label: 'Equipe',        icon: 'person-plus' },
  { key: 'forno',  label: 'Forno',         icon: 'flame' },
];

export default function Sidebar({ active, onChange, onExportBackup, onImportBackup, onOpenSettings, onLogout, syncing, userEmail, isViewer, isEditor, viewerScopes, modulosAtivos, fornoOptions, activeForno, onSwitchForno }) {
  const visibleItems = (isViewer || isEditor) && viewerScopes
    ? ITEMS.filter(item => viewerScopes.includes(item.key))
    : modulosAtivos
      ? ITEMS.filter(item => modulosAtivos.includes(item.key))
      : ITEMS;

  const showFornoSwitcher = fornoOptions?.length > 1;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <svg width="28" height="28" viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
          <rect width="64" height="64" rx="16" fill="oklch(65% 0.19 38)"/>
          <path d="M6 56 L6 40 L14 40 L14 26 L20 26 L20 36 L28 36 L28 20 L34 20 L34 30 L44 30 L44 14 L50 14 L50 26 L58 26 L58 56 Z" fill="white"/>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span className={styles.logoText}>FabricaLog</span>
          {(isViewer || isEditor) && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: isEditor ? 'oklch(72% 0.18 145)' : 'oklch(76% 0.17 68)',
              background: isEditor ? 'oklch(72% 0.18 145 / 0.12)' : 'oklch(76% 0.17 68 / 0.12)',
              padding: '2px 7px', borderRadius: 4, alignSelf: 'flex-start',
            }}>
              {isEditor ? 'Editor' : 'Visualização'}
            </span>
          )}
          {showFornoSwitcher && (
            <div style={{ marginTop: 6 }}>
              <FornoToggle options={fornoOptions} active={activeForno} onChange={onSwitchForno} fullWidth />
            </div>
          )}
        </div>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map(item => (
          <button
            key={item.key}
            className={`${styles.item} ${active === item.key ? styles.active : ''}`}
            onClick={() => onChange(item.key)}
          >
            <Ic name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        {userEmail && (
          <div style={{ padding: '6px 12px 8px', fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: syncing ? 'var(--warning)' : 'var(--success)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{syncing ? 'Sincronizando...' : userEmail}</span>
          </div>
        )}
        <button className={styles.footerBtn} onClick={onExportBackup}>
          <Ic name="download" size={14} /><span>Backup</span>
        </button>
        <button className={styles.footerBtn} onClick={onImportBackup}>
          <Ic name="upload" size={14} /><span>Restaurar</span>
        </button>
        <button className={styles.footerBtn} onClick={onOpenSettings}>
          <Ic name="settings" size={14} /><span>Configurações</span>
        </button>
        <button className={styles.footerBtn} onClick={onLogout}>
          <Ic name="x" size={14} /><span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
