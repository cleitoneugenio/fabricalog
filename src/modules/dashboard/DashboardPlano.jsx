import { useState } from 'react';
import Btn from '../../components/Btn';
import Ic from '../../components/Ic';
import Modal from '../../components/Modal';
import { countFornos } from '../../utils/calcSemana';
import styles from './DashboardPlano.module.css';

const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function buildDefaultPlano(meta) {
  const base = Math.floor(meta / 6);
  const extra = meta % 6;
  return Array.from({ length: 6 }, (_, i) => base + (i < extra ? 1 : 0));
}

function normalizePlano(plano, meta) {
  if (!plano || !Array.isArray(plano) || plano.length !== 6) return buildDefaultPlano(meta);
  if (Array.isArray(plano[0])) return buildDefaultPlano(meta);
  return plano.map(v => Number(v) || 0);
}

function getTodayIdx(semana) {
  const start = new Date(semana.dataInicio + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diff = Math.round((today - start) / (1000 * 60 * 60 * 24));
  if (diff < 0) return -1;
  return Math.min(6, diff);
}

function calcAjustado(meta, plano, real, todayIdx) {
  const cutoff = Math.max(0, todayIdx);
  const donePast = real.slice(0, cutoff).reduce((s, v) => s + v, 0);
  const remaining = Math.max(0, meta - donePast);
  const daysLeft = 6 - cutoff;
  if (daysLeft <= 0) return [...plano];

  const planSlice = plano.slice(cutoff);
  const planSum = planSlice.reduce((s, v) => s + v, 0);
  const result = [...plano];

  if (planSum === 0) {
    const base = Math.floor(remaining / daysLeft);
    const extra = remaining % daysLeft;
    for (let i = cutoff; i < 6; i++) {
      result[i] = base + (i - cutoff < extra ? 1 : 0);
    }
  } else {
    let sumR = 0;
    for (let i = cutoff; i < 6; i++) {
      result[i] = Math.round((plano[i] / planSum) * remaining);
      sumR += result[i];
    }
    const diff = remaining - sumR;
    result[cutoff] = Math.max(0, result[cutoff] + diff);
  }
  return result;
}

export default function DashboardPlano({ semana, onUpdateSemana }) {
  const meta = semana.meta || 10;
  const metaMilheiros = semana.metaMilheiros || 0;
  const dias = semana.dias || [];

  const plano = normalizePlano(semana.plano, meta);
  const real = dias.map(d => countFornos([d]));
  const todayIdx = getTodayIdx(semana);
  const ajustado = calcAjustado(meta, plano, real, todayIdx);

  const doneTotal = real.reduce((s, v) => s + v, 0);
  const remaining = Math.max(0, meta - doneTotal);
  const pct = Math.min(100, Math.round((doneTotal / Math.max(1, meta)) * 100));
  const weekStarted = todayIdx >= 0;
  const weekOver = todayIdx >= 6;
  const metaOk = doneTotal >= meta;

  // Milheiros tracking
  const milheirosDia = dias.map(d => Number(d.vendas) || 0);
  const milheirosTotal = milheirosDia.reduce((s, v) => s + v, 0);
  const metaMilheirosTotal = metaMilheiros * 6;
  const milheirosPct = metaMilheirosTotal > 0
    ? Math.min(100, Math.round((milheirosTotal / metaMilheirosTotal) * 100))
    : 0;
  const milheirosMetaOk = metaMilheirosTotal > 0 && milheirosTotal >= metaMilheirosTotal;
  const milheirosRestando = Math.max(0, metaMilheirosTotal - milheirosTotal);

  const [showEdit, setShowEdit] = useState(false);
  const [editValues, setEditValues] = useState([...plano]);
  const [editMeta, setEditMeta] = useState(metaMilheiros);
  const editTotal = editValues.reduce((s, v) => s + (Number(v) || 0), 0);

  function openEdit() {
    setEditValues([...plano]);
    setEditMeta(metaMilheiros);
    setShowEdit(true);
  }

  function savePlano() {
    onUpdateSemana({
      plano: editValues.map(v => Math.max(0, Number(v) || 0)),
      metaMilheiros: Math.max(0, Number(editMeta) || 0),
    });
    setShowEdit(false);
  }

  return (
    <div className={styles.root}>

      {/* Fornos progress card */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Progresso da Semana</span>
          <span className={styles.progressMeta}>Meta: {meta} fornos</span>
        </div>
        <div className={styles.progressNumbers}>
          <span className={styles.progressDone}>{doneTotal}</span>
          <span className={styles.progressOf}>de {meta}</span>
          <span className={styles.progressPct}>{pct}%</span>
        </div>
        <div className={styles.progressBarWrap}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${pct}%`, background: metaOk ? 'var(--success)' : 'var(--accent)' }}
          />
        </div>
        <div className={styles.progressStatus}>
          {weekOver
            ? metaOk
              ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Meta atingida</span>
              : <span style={{ color: 'var(--warning)', fontWeight: 700 }}>Faltaram {remaining} fornos</span>
            : weekStarted
              ? remaining > 0
                ? <span>{remaining} fornos restantes para a meta</span>
                : <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Meta atingida!</span>
              : <span>Semana ainda não iniciada</span>
          }
        </div>
      </div>

      {/* Milheiros progress card */}
      {metaMilheiros > 0 && (
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Milheiros — Vendas</span>
            <span className={styles.progressMeta}>Meta: {metaMilheiros} milh./dia</span>
          </div>
          <div className={styles.progressNumbers}>
            <span className={styles.progressDone}>{milheirosTotal.toFixed(1)}</span>
            <span className={styles.progressOf}>de {metaMilheirosTotal.toFixed(1)}</span>
            <span className={styles.progressPct}>{milheirosPct}%</span>
          </div>
          <div className={styles.progressBarWrap}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${milheirosPct}%`, background: milheirosMetaOk ? 'var(--success)' : 'var(--accent)' }}
            />
          </div>
          <div className={styles.progressStatus}>
            {weekOver
              ? milheirosMetaOk
                ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Meta atingida</span>
                : <span style={{ color: 'var(--warning)', fontWeight: 700 }}>Faltaram {milheirosRestando.toFixed(1)} milh.</span>
              : weekStarted
                ? milheirosRestando > 0
                  ? <span>{milheirosRestando.toFixed(1)} milh. restantes para a meta</span>
                  : <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Meta atingida!</span>
                : <span>Semana ainda não iniciada</span>
            }
          </div>
        </div>
      )}

      {/* Today callout */}
      {weekStarted && !weekOver && (
        <div className={styles.todayCard}>
          <div className={styles.todayLeft}>
            <span className={styles.todayBadge}>Hoje — {DAY_SHORT[todayIdx]}</span>
            <span className={styles.todayLabel}>Meta do dia</span>
            {ajustado[todayIdx] !== plano[todayIdx] && (
              <span className={styles.todayAdjust} style={{ color: ajustado[todayIdx] > plano[todayIdx] ? 'var(--warning)' : 'var(--success)' }}>
                {ajustado[todayIdx] > plano[todayIdx]
                  ? `+${ajustado[todayIdx] - plano[todayIdx]} ajustado (dias anteriores)`
                  : `${ajustado[todayIdx] - plano[todayIdx]} (adiantado)`}
              </span>
            )}
          </div>
          <div className={styles.todayRight}>
            <span className={styles.todayNum}>{ajustado[todayIdx]}</span>
            <span className={styles.todayUnit}>fornos</span>
          </div>
        </div>
      )}

      {/* Day grid */}
      <div className={styles.daysGrid}>
        {DAY_SHORT.map((day, i) => {
          const isPast = todayIdx >= 0 && i < todayIdx;
          const isToday = i === todayIdx;
          const actual = real[i];
          const met = isPast && actual >= plano[i];
          const missed = isPast && actual < plano[i];
          const diff = isPast ? actual - plano[i] : ajustado[i] - plano[i];
          const adjusted = !isPast && ajustado[i] !== plano[i];
          const milh = milheirosDia[i] || 0;
          const milhOk = metaMilheiros > 0 && milh >= metaMilheiros;

          return (
            <div
              key={day}
              className={[
                styles.dayCard,
                isToday ? styles.dayCardToday : '',
                missed ? styles.dayCardMissed : '',
                met ? styles.dayCardOk : '',
              ].join(' ')}
            >
              <div className={styles.dayTop}>
                <span className={styles.dayName}>{day}</span>
                {isToday && <span className={styles.todayTag}>Hoje</span>}
                {met && <span className={styles.statusOk}>✓</span>}
                {missed && <span className={styles.statusMiss}>!</span>}
              </div>

              <span className={styles.dayNum}>
                {isPast ? actual : ajustado[i]}
              </span>

              <div className={styles.daySub}>
                {isPast
                  ? diff !== 0
                    ? <span style={{ color: diff > 0 ? 'var(--success)' : 'var(--warning)' }}>
                        {diff > 0 ? '+' : ''}{diff} vs plano
                      </span>
                    : <span>no plano</span>
                  : adjusted
                    ? <span style={{ color: 'var(--warning)' }}>plano {plano[i]} → {ajustado[i]}</span>
                    : <span>plano: {plano[i]}</span>
                }
              </div>

              {metaMilheiros > 0 && (
                <div className={styles.milheiroRow}>
                  <span
                    className={styles.milheiroVal}
                    style={{ color: isPast ? (milhOk ? 'var(--success)' : 'var(--warning)') : 'var(--text-dim)' }}
                  >
                    {milh > 0 ? milh.toFixed(1) : '—'}
                  </span>
                  <span className={styles.milheiroMeta}>/ {metaMilheiros} milh.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit plan */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Btn variant="ghost" size="sm" onClick={openEdit}>
          <Ic name="edit" size={14} /> Editar plano
        </Btn>
      </div>

      {/* Edit modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar plano semanal"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={savePlano}>Salvar</Btn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Milheiros meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Meta de milheiros por dia
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                min={0}
                step={0.5}
                value={editMeta}
                onChange={e => setEditMeta(e.target.value)}
                placeholder="0"
                style={{
                  background: 'oklch(15% 0.016 38)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text)',
                  padding: '10px 12px',
                  fontSize: 22,
                  fontFamily: 'var(--font)',
                  fontWeight: 800,
                  width: 110,
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
                milheiros/dia
                {Number(editMeta) > 0 && (
                  <span style={{ display: 'block', fontSize: 11, marginTop: 2 }}>
                    Total semanal: {(Number(editMeta) * 6).toFixed(1)} milh.
                  </span>
                )}
              </span>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Fornos distribution */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0 }}>
              Distribua os <strong style={{ color: 'var(--text)' }}>{meta} fornos</strong> da meta pelos dias da semana.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {DAY_SHORT.map((day, i) => (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{day}</label>
                  <input
                    type="number"
                    min={0}
                    max={meta}
                    value={editValues[i]}
                    onChange={e => {
                      const copy = [...editValues];
                      copy[i] = Number(e.target.value) || 0;
                      setEditValues(copy);
                    }}
                    style={{
                      background: 'oklch(15% 0.016 38)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text)',
                      padding: '10px 8px',
                      fontSize: 18,
                      fontFamily: 'var(--font)',
                      fontWeight: 800,
                      textAlign: 'center',
                      width: '100%',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'oklch(15% 0.016 38)',
              borderRadius: 8,
              border: `1px solid ${editTotal === meta ? 'var(--success)' : editTotal > meta ? 'var(--danger)' : 'var(--border)'}`,
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>Total distribuído</span>
              <span style={{
                fontSize: 15,
                fontWeight: 800,
                color: editTotal === meta ? 'var(--success)' : editTotal > meta ? 'var(--danger)' : 'var(--warning)',
              }}>
                {editTotal} / {meta}{editTotal === meta ? ' ✓' : editTotal > meta ? ` (+${editTotal - meta})` : ` (faltam ${meta - editTotal})`}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
