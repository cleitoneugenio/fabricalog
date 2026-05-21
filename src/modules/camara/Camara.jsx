import { useState, useMemo } from 'react';
import styles from './Camara.module.css';

const TOTAL_CAMARA = 16953;

function calcByLinhas(raw) {
  const linhas = parseInt(raw, 10);
  if (!linhas || linhas < 1) return null;
  if (linhas > 33) return { error: 'Número de linhas excede o total da câmara (33 linhas).' };

  let portaTijolos = 0;
  if (linhas >= 1) portaTijolos += 319;
  if (linhas >= 2) portaTijolos += (Math.min(linhas, 8) - 1) * 462;

  const fundoTijolos = linhas > 8 ? (linhas - 8) * 536 : 0;
  const total = portaTijolos + fundoTijolos;
  const restante = TOTAL_CAMARA - total;
  const metragemReal = +(linhas * 0.20).toFixed(2);

  return { linhas, metragemReal, portaTijolos, fundoTijolos, total, restante };
}

function fmt(n) {
  return n.toLocaleString('pt-BR');
}

export default function Camara() {
  const [value, setValue] = useState('');
  const result = useMemo(() => calcByLinhas(value), [value]);

  return (
    <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>Calculadora</h1>
        <p className={styles.sub}>Forno 1 — retirada da câmara</p>
      </div>

      <div className={styles.inputCard}>
        <label className={styles.inputLabel}>Linhas retiradas</label>
        <div className={styles.inputWrap}>
          <input
            className={styles.input}
            type="number"
            step="1"
            min="1"
            max="33"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="ex: 15"
            autoFocus
          />
          <span className={styles.inputUnit}>linhas</span>
        </div>
        <p className={styles.inputHint}>Conte as fileiras retiradas da porta pro fundo (máx. 33)</p>
      </div>

      {result?.error && (
        <div className={styles.errorCard}>{result.error}</div>
      )}

      {result && !result.error && (
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <span className={styles.resultLabel}>
              Câmara Forno 1 — {result.linhas} linhas · {result.metragemReal.toFixed(2).replace('.', ',')}m
            </span>
          </div>

          <div className={styles.resultRow}>
            <span className={styles.rowKey}>Zona da porta</span>
            <span className={styles.rowVal}>{fmt(result.portaTijolos)} tijolos</span>
          </div>
          <div className={styles.resultRow}>
            <span className={styles.rowKey}>Zona do fundo</span>
            <span className={styles.rowVal}>{fmt(result.fundoTijolos)} tijolos</span>
          </div>

          <div className={styles.divider} />

          <div className={`${styles.resultRow} ${styles.totalRow}`}>
            <span className={styles.rowKey}>Total retirado</span>
            <span className={`${styles.rowVal} ${styles.totalVal}`}>{fmt(result.total)} tijolos</span>
          </div>

          <div className={styles.heroRestante}>
            <span className={styles.heroRestanteLabel}>Restante no forno</span>
            <span className={styles.heroRestanteVal}>{fmt(result.restante)}</span>
            <span className={styles.heroRestanteUnit}>tijolos</span>
          </div>

          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              style={{ width: `${Math.max(0, (result.restante / TOTAL_CAMARA) * 100).toFixed(1)}%` }}
            />
          </div>
          <div className={styles.progressLabels}>
            <span>{((result.restante / TOTAL_CAMARA) * 100).toFixed(0)}% restante</span>
            <span>Total câmara: {fmt(TOTAL_CAMARA)}</span>
          </div>
        </div>
      )}

      {!value && (
        <div className={styles.infoCard}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoKey}>Linhas 1–8 (porta)</span>
              <span className={styles.infoVal}>462 tijolos/linha</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoKey}>Linha 1 (desconto)</span>
              <span className={styles.infoVal}>319 tijolos</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoKey}>Linhas 9–33 (fundo)</span>
              <span className={styles.infoVal}>536 tijolos/linha</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoKey}>Total da câmara</span>
              <span className={styles.infoVal}>16.953 tijolos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
