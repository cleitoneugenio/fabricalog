import { formatBRL } from '../../utils/formatBRL';
import { DAY_KEYS, DAY_FULL_NAMES } from '../../utils/weekLabel';

// ── Color palette (hex equivalents of the app's OKLCH tokens) ─────────────────
const C = {
  bg:         '#1c1917',
  bgAlt:      '#211e1b',
  bgHeader:   '#231f1c',
  bgFooter:   '#1f1c19',
  border:     '#38312b',
  text:       '#f0ebe5',
  textDim:    '#7a6e68',
  textSubtle: '#9e9088',
  success:    '#6dba6a',
  danger:     '#d96262',
  accent:     '#e08830',
};

// ── Canvas helpers ────────────────────────────────────────────────────────────
function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (ctx.measureText(t + '…').width > maxWidth && t.length > 1) {
    t = t.slice(0, -1);
  }
  return t + '…';
}

// ── Main export ───────────────────────────────────────────────────────────────
export function gerarImagemDiaria(ponto, employees, dayKey) {
  const dayIdx  = DAY_KEYS.indexOf(dayKey);
  const dayFull = DAY_FULL_NAMES[dayIdx];

  // Dates
  const startDate = new Date(ponto.dataInicio + 'T12:00:00');
  const dayDate   = new Date(startDate);
  dayDate.setDate(dayDate.getDate() + dayIdx);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 5);

  const fmtShort = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const fmtFull  = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const weekStr = `Semana ${ponto.numero}  ·  ${fmtShort(startDate)} a ${fmtShort(endDate)}`;
  const dateStr = fmtFull(dayDate);

  // Build row data for every displayed employee
  const rows = employees.map((emp, i) => {
    const val    = ponto.dias?.[emp.id]?.[dayKey];
    const isFalta = val === 'F';
    const hasVal  = val !== '' && val != null;
    return { idx: i + 1, name: emp.name, val, isFalta, hasVal };
  });

  // Aggregates
  const totalDia = rows.reduce((s, r) => s + (!r.isFalta && r.hasVal ? (Number(r.val) || 0) : 0), 0);
  const ativos   = rows.filter(r => r.hasVal && !r.isFalta).length;
  const faltas   = rows.filter(r => r.isFalta).length;
  const ausentes = rows.filter(r => !r.hasVal).length;

  // ── Canvas dimensions ─────────────────────────────────────────────────────
  const SCALE = 2;
  const W     = 480;
  const PAD   = 24;
  const ROW_H = 48;
  const HDR_H = 100;
  const FTR_H = 72;
  const SEP   = 1;
  const H     = HDR_H + SEP + rows.length * ROW_H + SEP + FTR_H;

  const canvas    = document.createElement('canvas');
  canvas.width    = W * SCALE;
  canvas.height   = H * SCALE;
  const ctx       = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'alphabetic';

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Top accent strip ─────────────────────────────────────────────────────
  ctx.fillStyle = C.accent;
  ctx.fillRect(0, 0, W, 4);

  // ── Header background ─────────────────────────────────────────────────────
  ctx.fillStyle = C.bgHeader;
  ctx.fillRect(0, 4, W, HDR_H - 4);

  // Brand label
  ctx.font      = '600 9px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = C.textDim;
  ctx.fillText('FABRICALOG · CONTROLE DE PONTO', PAD, 22);

  // Week range
  ctx.font      = '600 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = C.textSubtle;
  ctx.fillText(weekStr, PAD, 44);

  // Day name (big)
  ctx.font      = '800 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = C.text;
  ctx.fillText(dayFull, PAD, 82);

  // Date — right side, accent
  ctx.font      = '600 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = C.accent;
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - PAD, 82);
  ctx.textAlign = 'left';

  // Header separator
  ctx.fillStyle = C.border;
  ctx.fillRect(0, HDR_H, W, SEP);

  // ── Employee rows ─────────────────────────────────────────────────────────
  rows.forEach((row, i) => {
    const y    = HDR_H + SEP + i * ROW_H;
    const midY = y + ROW_H * 0.62;

    // Alternate row background
    if (i % 2 !== 0) {
      ctx.fillStyle = C.bgAlt;
      ctx.fillRect(0, y, W, ROW_H);
    }

    // Row index
    ctx.font      = '500 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = C.textDim;
    ctx.textAlign = 'left';
    ctx.fillText(String(row.idx).padStart(2, '0'), PAD, midY);

    // Employee name (truncated if needed)
    ctx.font      = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = C.text;
    const nameMaxW = W - PAD * 2 - 26 - 120;
    ctx.fillText(truncate(ctx, row.name, nameMaxW), PAD + 26, midY);

    // Value / FALTA / —
    ctx.textAlign = 'right';
    if (row.isFalta) {
      ctx.font      = '700 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = C.danger;
      ctx.fillText('FALTA', W - PAD, midY);
    } else if (row.hasVal) {
      ctx.font      = '700 13px "Courier New", "Lucida Console", monospace';
      ctx.fillStyle = C.success;
      ctx.fillText(formatBRL(Number(row.val)), W - PAD, midY);
    } else {
      ctx.font      = '500 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = C.textDim;
      ctx.fillText('—', W - PAD, midY);
    }
    ctx.textAlign = 'left';

    // Row divider (inset)
    ctx.fillStyle = C.border;
    ctx.fillRect(PAD, y + ROW_H - 1, W - PAD * 2, 1);
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const ftY = HDR_H + SEP + rows.length * ROW_H;
  ctx.fillStyle = C.border;
  ctx.fillRect(0, ftY, W, SEP);
  ctx.fillStyle = C.bgFooter;
  ctx.fillRect(0, ftY + SEP, W, FTR_H);

  // Stats text
  const parts = [
    ativos > 0   ? `${ativos} trabalhando`                      : null,
    faltas > 0   ? `${faltas} falta${faltas !== 1 ? 's' : ''}` : null,
    ausentes > 0 ? `${ausentes} sem registro`                   : null,
  ].filter(Boolean);
  const statsStr = parts.join('  ·  ');

  ctx.font      = '500 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = C.textDim;
  ctx.fillText(statsStr, PAD, ftY + SEP + 26);

  // Total — right, success green
  ctx.font      = '800 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = C.success;
  ctx.textAlign = 'right';
  ctx.fillText(formatBRL(totalDia), W - PAD, ftY + SEP + 26);
  ctx.textAlign = 'left';

  // Watermark
  ctx.font      = '400 10px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = C.textDim;
  ctx.fillText('fabricalog.app', PAD, ftY + SEP + FTR_H - 14);

  // ── Download ──────────────────────────────────────────────────────────────
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `diaria-${dayKey}-semana-${ponto.numero}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}
