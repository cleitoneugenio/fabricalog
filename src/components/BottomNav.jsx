import Ic from './Ic';
import styles from './BottomNav.module.css';

const ITEMS = [
  { key: 'dash',   label: 'Dashboard', icon: 'chart-bar' },
  { key: 'semana', label: 'Produção',  icon: 'production' },
  { key: 'carga',  label: 'Cargas',    icon: 'truck' },
  { key: 'ponto',  label: 'Ponto',     icon: 'users' },
  { key: 'camara', label: 'Calcular',  icon: 'camara' },
  { key: 'equipe', label: 'Equipe',    icon: 'person-plus' },
  { key: 'forno',  label: 'Forno',     icon: 'flame' },
];

export default function BottomNav({ active, onChange, isViewer, isEditor, viewerScopes, modulosAtivos }) {
  const visibleItems = (isViewer || isEditor) && viewerScopes
    ? ITEMS.filter(item => viewerScopes.includes(item.key))
    : modulosAtivos
      ? ITEMS.filter(item => modulosAtivos.includes(item.key))
      : ITEMS;

  return (
    <nav className={styles.nav}>
      {visibleItems.map(item => (
        <button
          key={item.key}
          className={`${styles.item} ${active === item.key ? styles.active : ''}`}
          onClick={() => onChange(item.key)}
        >
          <Ic name={item.icon} size={22} />
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
