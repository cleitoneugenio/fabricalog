import styles from './Skeleton.module.css';

export function SkeletonLine({ height = 14, width = '100%' }) {
  return <div className={styles.line} style={{ height, width }} />;
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <SkeletonLine height={14} width="60%" />
      <SkeletonLine height={11} width="40%" />
    </div>
  );
}
