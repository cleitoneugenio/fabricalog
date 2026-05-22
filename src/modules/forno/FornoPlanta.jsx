import { useState } from 'react';
import Btn from '../../components/Btn';
import styles from './FornoPlanta.module.css';

const STATUS_CONFIG = {
  vazio:          { label: 'Vazio',          fill: '#1E1714', border: '#2E2420', text: '#4A3830', dotColor: '#2E2420' },
  carregado:      { label: 'Carregado',      fill: '#2E200C', border: '#C9A83C', text: '#C9A83C', dotColor: '#C9A83C' },
  queimando:      { label: 'Queimando',      fill: '#2E1210', border: '#C25040', text: '#C25040', dotColor: '#C25040' },
  descarregando:  { label: 'Descarregando',  fill: '#0E1E2A', border: '#4A9ECC', text: '#4A9ECC', dotColor: '#4A9ECC' },
};

const STATUS_ICONS = {
  vazio:         '○',
  carregado:     '▪',
  queimando:     '◉',
  descarregando: '↓',
};

const BLOCO_A = ['F1','F2','F3','F4','F5','F6','F7','F8','F9'];
const BLOCO_B = ['F18','F17','F16','F15','F14','F13','F12','F11','F10'];

const CHAMBER_W = 168;
const CHAMBER_H = 56;
const BLOCO_A_X = 75;
const BLOCO_B_X = 257;
const START_Y   = 72;
const STEP      = CHAMBER_H + 4;

function ChamberShape({ id, idx, xStart, doorSide, chamber, selected, onClick }) {
  const { status, restante } = chamber;
  const y   = START_Y + idx * STEP;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.vazio;
  const selBorder = selected ? '#F5EDE8' : cfg.border;
  const selWidth  = selected ? 2.5 : 0.8;

  const doorPath = doorSide === 'left'
    ? `M${xStart} ${y+16} Q${xStart-11} ${y+16} ${xStart-11} ${y+28} Q${xStart-11} ${y+40} ${xStart} ${y+40}`
    : `M${xStart+CHAMBER_W} ${y+16} Q${xStart+CHAMBER_W+11} ${y+16} ${xStart+CHAMBER_W+11} ${y+28} Q${xStart+CHAMBER_W+11} ${y+40} ${xStart+CHAMBER_W} ${y+40}`;

  const hasRestante = status === 'descarregando' && restante != null && restante > 0;

  return (
    <g onClick={() => onClick(id)} style={{ cursor: 'pointer' }}>
      <rect
        x={xStart} y={y} width={CHAMBER_W} height={CHAMBER_H} rx={3}
        fill={cfg.fill} stroke={selBorder} strokeWidth={selWidth}
      />
      {selected && (
        <rect x={xStart+2} y={y+2} width={CHAMBER_W-4} height={CHAMBER_H-4} rx={2}
          fill="none" stroke="#F5EDE8" strokeWidth={0.5} opacity={0.3}/>
      )}
      <text x={xStart + CHAMBER_W / 2} y={y + (hasRestante ? 20 : 26)}
        textAnchor="middle" fontSize={13} fontWeight={700}
        fill={cfg.text} fontFamily="inherit">
        {id}
      </text>
      {hasRestante ? (
        <text x={xStart + CHAMBER_W / 2} y={y + 38}
          textAnchor="middle" fontSize={10} fontWeight={700}
          fill={cfg.text} fontFamily="inherit">
          ↓ faltam {restante} mi
        </text>
      ) : (
        <text x={xStart + CHAMBER_W / 2} y={y + 38}
          textAnchor="middle" fontSize={9}
          fill={cfg.text} fontFamily="inherit" opacity={0.8}>
          {STATUS_ICONS[status]} {cfg.label}
        </text>
      )}
      <path d={doorPath} fill="#141110" stroke={cfg.border} strokeWidth={0.8}/>
    </g>
  );
}

function SummaryBar({ chambers }) {
  const counts = Object.values(chambers).reduce((acc, c) => {
    const s = c?.status ?? 'vazio';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const items = [
    { key: 'vazio',         label: 'Vazias',        color: '#4A3830' },
    { key: 'carregado',     label: 'Carregadas',     color: '#C9A83C' },
    { key: 'queimando',     label: 'Queimando',      color: '#C25040' },
    { key: 'descarregando', label: 'Descarregando',  color: '#4A9ECC' },
  ];

  return (
    <div className={styles.summary}>
      {items.map(({ key, label, color }) => (
        <div key={key} className={styles.summaryItem}>
          <span className={styles.summaryNum} style={{ color }}>{counts[key] ?? 0}</span>
          <span className={styles.summaryLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function FornoPlanta({ chambers, onSetStatus, onSetRestante, onConcluirDescarga, onResetAll, isViewer }) {
  const [selected, setSelected] = useState(null);

  function handleClick(id) {
    if (isViewer) return;
    setSelected(prev => prev === id ? null : id);
  }

  const selectedChamber = selected ? (chambers[selected] ?? { status: 'vazio', restante: null }) : null;
  const selectedStatus  = selectedChamber?.status ?? null;
  const selectedRestante = selectedChamber?.restante ?? '';

  return (
    <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Planta do Forno</h2>
          <p className={styles.sub}>18 câmaras · 2 blocos · Toque para alterar o estado</p>
        </div>
        {!isViewer && <Btn variant="ghost" size="sm" onClick={onResetAll}>Resetar</Btn>}
      </div>

      <SummaryBar chambers={chambers} />

      <div className={styles.body}>
        <div className={styles.svgWrap}>
          <svg viewBox="0 0 500 680" width="100%"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', fontFamily: 'var(--font)' }}>
            <defs>
              <marker id="hArrow" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth={5} markerHeight={5} orient="auto">
                <path d="M2 1L8 5L2 9" fill="none" stroke="#C25040" strokeWidth={1.5}/>
              </marker>
            </defs>

            <rect x={0} y={0} width={500} height={680} fill="#141110"/>
            <rect x={60} y={52} width={380} height={570} rx={6}
              fill="#1A1512" stroke="#3A2820" strokeWidth={1.5}/>

            <text x={155} y={67} textAnchor="middle" fontSize={9} fontWeight={600} fill="#7A5A4A">
              Bloco A (F1–F9)
            </text>
            <text x={345} y={67} textAnchor="middle" fontSize={9} fontWeight={600} fill="#7A5A4A">
              Bloco B (F18–F10)
            </text>

            {BLOCO_A.map((id, i) => (
              <ChamberShape key={id} id={id} idx={i}
                xStart={BLOCO_A_X} doorSide="left"
                chamber={chambers[id] ?? { status: 'vazio', restante: null }}
                selected={selected === id}
                onClick={handleClick}
              />
            ))}

            {BLOCO_B.map((id, i) => (
              <ChamberShape key={id} id={id} idx={i}
                xStart={BLOCO_B_X} doorSide="right"
                chamber={chambers[id] ?? { status: 'vazio', restante: null }}
                selected={selected === id}
                onClick={handleClick}
              />
            ))}

            <line x1={250} y1={52} x2={250} y2={622} stroke="#5A3020" strokeWidth={2.5}/>

            {BLOCO_A.map((_, i) => {
              const y = START_Y + i * STEP + CHAMBER_H / 2;
              return (
                <line key={i} x1={232} y1={y} x2={268} y2={y}
                  stroke="#C25040" strokeWidth={0.6}
                  strokeDasharray="3 2" markerEnd="url(#hArrow)" opacity={0.5}/>
              );
            })}

            <text x={250} y={638} textAnchor="middle" fontSize={8} fill="#5A3020" fontStyle="italic">
              ← Calor passa pelas paredes divisórias →
            </text>
            <text x={250} y={652} textAnchor="middle" fontSize={8} fill="#4A2E20" fontStyle="italic">
              Lenha carregada pelo topo do forno
            </text>
          </svg>
        </div>

        {/* Painel lateral */}
        <div className={`${styles.panel} ${selected ? styles.panelVisible : styles.panelHidden}`}>
          {!selected && (
            <p className={styles.panelEmpty}>Toque em uma câmara para alterar o estado</p>
          )}
          {selected && (
            <>
              <div className={styles.panelHeader}>
                <span className={styles.panelChamber}>{selected}</span>
                <button className={styles.panelClose} onClick={() => setSelected(null)}>✕</button>
              </div>

              <div className={styles.statusGrid}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    className={`${styles.statusBtn} ${selectedStatus === key ? styles.statusBtnActive : ''}`}
                    style={{
                      '--s-border': cfg.border,
                      '--s-bg':     selectedStatus === key ? cfg.fill : 'transparent',
                    }}
                    onClick={() => onSetStatus(selected, key)}
                  >
                    <span className={styles.statusIcon} style={{ color: cfg.dotColor }}>
                      {STATUS_ICONS[key]}
                    </span>
                    <span className={styles.statusLabel} style={{ color: cfg.text }}>
                      {cfg.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Painel de descarga parcial */}
              {selectedStatus === 'descarregando' && (
                <div className={styles.descargaBox}>
                  <label className={styles.descargaLabel}>Faltam (milheiros)</label>
                  <div className={styles.descargaRow}>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={selectedRestante}
                      placeholder="0"
                      className={styles.descargaInput}
                      onChange={e => onSetRestante(selected, e.target.value)}
                    />
                    <span className={styles.descargaUnit}>mi</span>
                  </div>
                  <button
                    className={styles.concluirBtn}
                    onClick={() => { onConcluirDescarga(selected); setSelected(null); }}
                  >
                    ✓ Descarga concluída
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
