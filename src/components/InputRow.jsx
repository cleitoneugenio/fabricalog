import styles from './InputRow.module.css';

export default function InputRow({ label, type = 'text', value, onChange, hint, children, rows = 3, placeholder }) {
  const id = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.row}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}

      {type === 'select' ? (
        <select
          id={id}
          className={styles.input}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        >
          {children}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          className={`${styles.input} ${styles.textarea}`}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={styles.input}
          value={value ?? ''}
          onChange={e => onChange(type === 'number' ? e.target.value : e.target.value)}
          placeholder={placeholder}
        />
      )}

      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
