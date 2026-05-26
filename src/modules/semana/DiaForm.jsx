import InputRow from '../../components/InputRow';
import styles from './DiaForm.module.css';

const QUALIDADE_OPTS = ['Pátio Seco', 'Pátio Molhado', 'Secador'];
const FORNOS = Array.from({ length: 18 }, (_, i) => `F${i + 1}`);

function FornoChipGrid({ selected, onToggle, multi = false }) {
  return (
    <div className={styles.chipGrid}>
      {FORNOS.map(f => {
        const isActive = multi
          ? Array.isArray(selected) && selected.includes(f)
          : selected === f;
        return (
          <button
            key={f}
            type="button"
            className={`${styles.chip} ${isActive ? (multi ? styles.chipActiveMulti : styles.chipActive) : ''}`}
            onClick={() => onToggle(f)}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}

export default function DiaForm({ dia, onChange, readOnly }) {
  const set = (field) => (value) => { if (!readOnly) onChange({ ...dia, [field]: value }); };

  const enfornas = Array.isArray(dia.enfornas)
    ? dia.enfornas.filter(v => v && typeof v === 'string' && v.startsWith('F'))
    : [];

  function toggleQueima(f) {
    if (readOnly) return;
    onChange({ ...dia, queima: dia.queima === f ? '' : f });
  }

  function toggleEnforna(f) {
    if (readOnly) return;
    const current = enfornas;
    if (current.includes(f)) {
      onChange({ ...dia, enfornas: current.filter(x => x !== f) });
    } else {
      onChange({ ...dia, enfornas: [...current, f] });
    }
  }

  return (
    <div className={styles.grid} style={readOnly ? { pointerEvents: 'none', opacity: 0.75 } : undefined}>

      {/* Queima — seleção única */}
      <div className={styles.chipGroup}>
        <span className={styles.chipLabel}>
          Queima
          {dia.queima && <span className={styles.chipSelected}>{dia.queima}</span>}
        </span>
        <FornoChipGrid selected={dia.queima || ''} onToggle={toggleQueima} />
      </div>

      {/* Enfornas — multi-seleção */}
      <div className={styles.chipGroup}>
        <span className={styles.chipLabel}>
          Enfornas
          {enfornas.length > 0 && (
            <span className={styles.chipSelected}>{enfornas.join(', ')}</span>
          )}
        </span>
        <FornoChipGrid selected={enfornas} onToggle={toggleEnforna} multi />
      </div>

      <InputRow label="Qualidade do Tijolo" type="select" value={dia.qualidade} onChange={set('qualidade')} disabled={readOnly}>
        {QUALIDADE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
      </InputRow>
      <InputRow label="Qtd. Funcionários" type="number" value={dia.qtdFunc} onChange={set('qtdFunc')} placeholder="0" disabled={readOnly} />
      <InputRow label="Pares de Luvas" type="number" value={dia.luvas} onChange={set('luvas')} placeholder="0" disabled={readOnly} />
      <InputRow label="Estoque (milheiros)" type="number" value={dia.estoque} onChange={set('estoque')} placeholder="0" disabled={readOnly} />
      <InputRow label="Vendas (milheiros)" type="number" value={dia.vendas} onChange={set('vendas')} placeholder="0.0" disabled={readOnly} />
      <InputRow label="Galpão (mi)" type="number" value={dia.emCaminhoes} onChange={set('emCaminhoes')} placeholder="0.0" disabled={readOnly} />
      <div className={styles.totalMi}>
        <span className={styles.totalMiLabel}>Total do dia</span>
        <span className={styles.totalMiVal}>
          {((Number(dia.estoque) || 0) + (Number(dia.vendas) || 0)).toFixed(1)} mi
        </span>
      </div>
      <div className={styles.full}>
        <InputRow label="Fornos Desocupados" type="text" value={dia.fornosDesocupados} onChange={set('fornosDesocupados')} placeholder="ex: F1 e metade do F2" disabled={readOnly} />
      </div>
      <div className={styles.full}>
        <InputRow label="Reforma" type="text" value={dia.reforma} onChange={set('reforma')} placeholder="ex: F6 em reforma" disabled={readOnly} />
      </div>
      <div className={styles.full}>
        <InputRow label="Ocorrências" type="textarea" value={dia.ocorrencia} onChange={set('ocorrencia')} placeholder="Descreva qualquer ocorrência do dia..." rows={3} disabled={readOnly} />
      </div>
    </div>
  );
}
