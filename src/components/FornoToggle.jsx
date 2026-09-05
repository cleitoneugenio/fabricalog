import styles from './Toggle.module.css';

function shortLabel(label = '') {
  return label.replace(/^forno\s+/i, '');
}

export default function FornoToggle({ options, active, onChange, fullWidth = false }) {
  return (
    <div className={`${styles.toggle} ${fullWidth ? styles.fullWidth : ''}`}>
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange?.(opt.key)}
          className={`${styles.btn} ${opt.key === active ? styles.btnActive : ''}`}
        >
          {shortLabel(opt.label)}
        </button>
      ))}
    </div>
  );
}
