import { DAY_NAMES } from '../../utils/weekLabel';
import styles from './OccurrenceList.module.css';

export default function OccurrenceList({ dias }) {
  const ocorrencias = (dias || [])
    .map((d, i) => ({ day: DAY_NAMES[i], text: d.ocorrencia }))
    .filter(o => o.text && o.text.trim());

  if (ocorrencias.length === 0) {
    return (
      <p className={styles.empty}>Nenhuma ocorrência registrada esta semana.</p>
    );
  }

  return (
    <ul className={styles.list}>
      {ocorrencias.map((o, i) => (
        <li key={i} className={styles.item}>
          <span className={styles.day}>{o.day}</span>
          <span className={styles.text}>{o.text}</span>
        </li>
      ))}
    </ul>
  );
}
