import styles from './Tag.module.css';

export default function Tag({ color = 'accent', children }) {
  return (
    <span className={`${styles.tag} ${styles[color]}`}>
      {children}
    </span>
  );
}
