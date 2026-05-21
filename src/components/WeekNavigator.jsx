import Ic from './Ic';
import styles from './WeekNavigator.module.css';

export default function WeekNavigator({ label, onPrev, onNext, disablePrev, disableNext }) {
  return (
    <div className={styles.nav}>
      <button
        className={styles.arrow}
        onClick={onPrev}
        disabled={disablePrev}
        aria-label="Semana anterior"
      >
        <Ic name="chevron-left" size={18} />
      </button>
      <span className={styles.label}>{label}</span>
      <button
        className={styles.arrow}
        onClick={onNext}
        disabled={disableNext}
        aria-label="Próxima semana"
      >
        <Ic name="chevron-right" size={18} />
      </button>
    </div>
  );
}
