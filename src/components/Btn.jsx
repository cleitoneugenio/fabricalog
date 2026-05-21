import styles from './Btn.module.css';

export default function Btn({ variant = 'primary', size = 'md', onClick, disabled, children, type = 'button', style }) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
