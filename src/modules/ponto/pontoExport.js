import { calcPonto } from '../../utils/calcPonto';

const DAY_KEYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

function fmt(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cellVal(v) {
  if (v === 'F' || v === 'f')
    return `<span class="cell-val cell-falta">F</span>`;
  const n = Number(v);
  if (!isNaN(n) && n >= 120)
    return `<span class="cell-val cell-high">${v}</span>`;
  if (!isNaN(n) && n > 0)
    return `<span class="cell-val cell-num">${v}</span>`;
  return `<span class="cell-dash">—</span>`;
}

function diasBadge(d) {
  const cls = d === 6 ? 'dias-6' : d === 5 ? 'dias-5' : d === 4 ? 'dias-4' : 'dias-low';
  return `<span class="dias-badge ${cls}">${d}</span>`;
}

function bonusCell(bonus, bonusEligible, bloqueado) {
  if (bonus > 0)
    return `<span class="bonus-yes">✓ ${fmtBRL(bonus)}</span>`;
  if (bonusEligible && bloqueado)
    return `<span class="bonus-blocked">✕ bloqueado</span>`;
  return `<span class="bonus-no">—</span>`;
}

function buildHTML({ ponto, rows, period, year, totalFolha, totalDias, totalBonus,
                     semanaCompleta, ausenciaTotal, dayTotals }) {
  const rowsHTML = rows.map(r => {
    const isZero = r.dias === 0;
    return `
      <tr${isZero ? ' class="zero-row"' : ''}>
        <td class="id-col">${r.id}</td>
        <td class="name">${r.name}</td>
        <td class="center">${cellVal(r.seg)}</td>
        <td class="center">${cellVal(r.ter)}</td>
        <td class="center">${cellVal(r.qua)}</td>
        <td class="center">${cellVal(r.qui)}</td>
        <td class="center">${cellVal(r.sex)}</td>
        <td class="center">${cellVal(r.sab)}</td>
        <td class="center">${diasBadge(r.dias)}</td>
        <td class="center">${bonusCell(r.bonus, r.bonusEligible, r.bloqueado)}</td>
        <td class="total-col">${fmtBRL(r.total)}</td>
      </tr>`;
  }).join('');

  const totalRowHTML = `
    <tr class="total-row">
      <td></td>
      <td class="total-label">Total Geral</td>
      ${dayTotals.map(v => `<td class="num">${v > 0 ? v.toLocaleString('pt-BR') : '—'}</td>`).join('')}
      <td class="center"><span style="font-family:var(--font-mono);font-weight:700;">${totalDias}</span></td>
      <td class="center"><span class="bonus-yes">${fmtBRL(totalBonus)}</span></td>
      <td class="total-col" style="font-size:14px;">${fmtBRL(totalFolha)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FabricaLog — Ponto Semana ${ponto.numero}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --bg:           oklch(12% 0.016 38);
  --bg-card:      oklch(17% 0.018 38);
  --bg-nav:       oklch(10% 0.014 38);
  --accent:       oklch(65% 0.19 38);
  --accent-light: oklch(74% 0.16 38);
  --accent-dim:   oklch(65% 0.19 38 / 0.13);
  --text:         oklch(93% 0.008 38);
  --text-muted:   oklch(57% 0.013 38);
  --text-subtle:  oklch(37% 0.011 38);
  --border:       oklch(23% 0.015 38);
  --danger:       oklch(63% 0.21 22);
  --danger-dim:   oklch(63% 0.21 22 / 0.12);
  --success:      oklch(68% 0.16 148);
  --success-dim:  oklch(68% 0.16 148 / 0.13);
  --warning:      oklch(76% 0.17 68);
  --warning-dim:  oklch(76% 0.17 68 / 0.13);
  --font:      'Syne', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: var(--bg); color: var(--text); font-family: var(--font); line-height: 1.5; min-height: 100vh; }

/* ── TOPBAR ── */
.topbar { background: var(--bg-nav); border-bottom: 1px solid var(--border); padding: 16px 32px; display: flex; align-items: center; gap: 14px; }
.brand { display: flex; align-items: center; gap: 12px; }
.brand-name { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; }
.brand-sub { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-top: 1px; }
.spacer { flex: 1; }
.pill { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 11px; font-weight: 600; padding: 5px 11px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.08em; }
.pill.amber { background: var(--warning-dim); color: var(--warning); }

/* ── PAGE ── */
.page { max-width: 1300px; margin: 0 auto; padding: 28px 32px 48px; }
.page-head { margin-bottom: 24px; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.page-label { font-size: 11px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600; margin-bottom: 5px; }
.page-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
.page-meta { display: flex; gap: 20px; }
.meta-item { display: flex; flex-direction: column; }
.meta-label { font-size: 10px; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.1em; }
.meta-value { font-size: 13px; font-weight: 600; font-family: var(--font-mono); }

/* ── KPIs ── */
.kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 24px; }
@media (max-width: 1000px) { .kpis { grid-template-columns: repeat(3, 1fr); } }
.kpi { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; }
.kpi.hi { border-color: oklch(65% 0.19 38 / 0.4); background: linear-gradient(160deg, oklch(20% 0.04 38), var(--bg-card)); }
.kpi-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; }
.kpi-value { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-top: 6px; }
.kpi-value .unit { font-size: 13px; color: var(--text-muted); font-weight: 500; margin-left: 4px; }
.kpi-sub { font-size: 11px; color: var(--text-subtle); margin-top: 4px; font-family: var(--font-mono); }
.badge { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-mono); font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; margin-top: 8px; }
.badge.up     { background: var(--success-dim); color: var(--success); }
.badge.warn   { background: var(--warning-dim); color: var(--warning); }
.badge.danger { background: var(--danger-dim);  color: var(--danger); }

/* ── LEGENDA ── */
.legenda { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.leg-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); }
.leg-dot { width: 22px; height: 22px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: var(--font-mono); flex-shrink: 0; }

/* ── TABELA ── */
.table-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead tr { background: var(--bg-nav); }
thead th { padding: 12px 14px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); border-bottom: 1px solid var(--border); white-space: nowrap; }
thead th.center { text-align: center; }
tbody tr { border-bottom: 1px solid var(--border); transition: background 0.1s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: oklch(20% 0.018 38); }
tbody tr.total-row { background: oklch(20% 0.04 38); border-top: 2px solid var(--accent); }
tbody tr.zero-row { opacity: 0.45; }
tbody td { padding: 10px 14px; color: var(--text); vertical-align: middle; }
tbody td.center { text-align: center; }
tbody td.num { font-family: var(--font-mono); font-size: 12px; text-align: center; }
tbody td.name { font-weight: 600; }
tbody td.id-col { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); text-align: center; }
tbody td.total-col { font-family: var(--font-mono); font-weight: 700; color: var(--accent); text-align: right; padding-right: 18px; }
tbody td.total-label { font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; }

/* Células de valor */
.cell-val { display: inline-flex; align-items: center; justify-content: center; min-width: 38px; height: 26px; border-radius: 6px; font-family: var(--font-mono); font-size: 12px; font-weight: 600; padding: 0 6px; }
.cell-falta { background: var(--danger-dim); color: var(--danger); }
.cell-num   { background: oklch(22% 0.016 38); color: var(--text); }
.cell-high  { background: oklch(65% 0.19 38 / 0.15); color: oklch(74% 0.16 38); }
.cell-dash  { color: var(--text-subtle); font-family: var(--font-mono); font-size: 12px; }

/* Dias presentes */
.dias-badge { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; font-family: var(--font-mono); font-size: 12px; font-weight: 700; }
.dias-6   { background: var(--success-dim); color: var(--success); }
.dias-5   { background: oklch(65% 0.19 38 / 0.2); color: var(--accent-light); }
.dias-4   { background: var(--warning-dim); color: var(--warning); }
.dias-low { background: var(--danger-dim); color: var(--danger); }

/* Bônus */
.bonus-yes     { display: inline-flex; align-items: center; gap: 4px; background: var(--success-dim); color: var(--success); font-family: var(--font-mono); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
.bonus-blocked { display: inline-flex; align-items: center; gap: 4px; background: var(--danger-dim); color: var(--danger); font-family: var(--font-mono); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
.bonus-no      { color: var(--text-subtle); font-family: var(--font-mono); font-size: 11px; }

/* Footer */
.footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 11px; color: var(--text-subtle); font-family: var(--font-mono); }
</style>
</head>
<body>

<header class="topbar">
  <div class="brand">
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="oklch(65% 0.19 38)"/>
      <path d="M6 56 L6 40 L14 40 L14 26 L20 26 L20 36 L28 36 L28 20 L34 20 L34 30 L44 30 L44 14 L50 14 L50 26 L58 26 L58 56 Z" fill="white"/>
    </svg>
    <div>
      <div class="brand-name">FabricaLog</div>
      <div class="brand-sub">Gestão de Cerâmica</div>
    </div>
  </div>
  <div class="spacer"></div>
  <span class="pill amber">Semana ${ponto.numero} · S${ponto.numero}</span>
</header>

<main class="page">

  <div class="page-head">
    <div>
      <div class="page-label">Controle de Ponto</div>
      <h1 class="page-title">Funcionários CEDAN</h1>
    </div>
    <div class="page-meta">
      <div class="meta-item"><span class="meta-label">Período</span><span class="meta-value">${period}</span></div>
      <div class="meta-item"><span class="meta-label">Semana</span><span class="meta-value">S${ponto.numero} / ${year}</span></div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi hi">
      <div class="kpi-label">Folha Total</div>
      <div class="kpi-value">${fmtBRL(totalFolha)}</div>
      <div class="badge warn">${rows.length} funcionários</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Dias Trabalhados</div>
      <div class="kpi-value">${totalDias}<span class="unit">dias</span></div>
      <div class="kpi-sub">de ${rows.length * 6} possíveis</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Total Bônus</div>
      <div class="kpi-value">${fmtBRL(totalBonus)}</div>
      <div class="badge up">${rows.filter(r => r.bonus > 0).length} colaboradores</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Semana Completa</div>
      <div class="kpi-value">${semanaCompleta}<span class="unit">func.</span></div>
      <div class="kpi-sub">6 dias sem falta</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Ausência Total</div>
      <div class="kpi-value">${ausenciaTotal}<span class="unit">func.</span></div>
      <div class="badge danger">0 dias presentes</div>
    </div>
  </div>

  <div class="legenda">
    <span style="font-size:11px; color:var(--text-subtle); font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">Legenda:</span>
    <div class="leg-item"><span class="leg-dot cell-falta">F</span> Falta</div>
    <div class="leg-item"><span class="leg-dot cell-num">80</span> Valor diário (R$)</div>
    <div class="leg-item"><span class="leg-dot cell-high">150</span> Acima de R$ 120</div>
    <div class="leg-item"><span class="leg-dot dias-6">6</span> Semana completa</div>
    <div class="leg-item"><span class="leg-dot dias-4">4</span> 4 dias presentes</div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Funcionário</th>
          <th class="center">Seg</th>
          <th class="center">Ter</th>
          <th class="center">Qua</th>
          <th class="center">Qui</th>
          <th class="center">Sex</th>
          <th class="center">Sáb</th>
          <th class="center">Dias</th>
          <th class="center">Bônus</th>
          <th style="text-align:right; padding-right:18px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
        ${totalRowHTML}
      </tbody>
    </table>
  </div>

  <footer class="footer">
    <span>Forno CEDAN · Controle de Ponto Semanal</span>
    <span>Semana ${ponto.numero} · ${period}/${year}</span>
  </footer>

</main>
</body>
</html>`;
}

export async function exportPonto(ponto, employees) {
  const rows = employees.map((emp, i) => {
    const d = ponto.dias[emp.id] ?? {};
    const { dias, bonus, bonusEligible, total } = calcPonto(d);
    return {
      id: i + 1, name: emp.name,
      seg: d.seg ?? '', ter: d.ter ?? '', qua: d.qua ?? '',
      qui: d.qui ?? '', sex: d.sex ?? '', sab: d.sab ?? '',
      dias, bonus, bonusEligible, total,
      bloqueado: !!d.bonus_bloqueado,
    };
  });

  const totalFolha     = rows.reduce((s, r) => s + r.total, 0);
  const totalDias      = rows.reduce((s, r) => s + r.dias, 0);
  const totalBonus     = rows.reduce((s, r) => s + r.bonus, 0);
  const semanaCompleta = rows.filter(r => r.dias === 6).length;
  const ausenciaTotal  = rows.filter(r => r.dias === 0).length;

  const dayTotals = DAY_KEYS.map(k =>
    rows.reduce((s, r) => {
      const v = r[k];
      return v !== 'F' && v !== '' && v != null ? s + (Number(v) || 0) : s;
    }, 0)
  );

  const start = new Date(ponto.dataInicio + 'T12:00:00');
  const end   = new Date(start);
  end.setDate(end.getDate() + 5);
  const period = `${fmt(start)} – ${fmt(end)}`;
  const year   = start.getFullYear();

  const html = buildHTML({ ponto, rows, period, year, totalFolha, totalDias,
                           totalBonus, semanaCompleta, ausenciaTotal, dayTotals });

  const { saveFile } = await import('../../utils/saveFile.js');
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  await saveFile(blob, `fabricalog-ponto-semana-${ponto.numero}.html`);
}
