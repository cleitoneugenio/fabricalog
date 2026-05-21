import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { countFornos } from '../../utils/calcSemana';

// Palette — hex equivalents of the app's oklch design system (html2canvas strips oklch)
const C = {
  bgDeep:     '#100b07',   // oklch(10% 0.014 38)  — topbar / footer
  bgMain:     '#180f0b',   // oklch(12% 0.016 38)  — page bg
  bgCard:     '#1e1410',   // oklch(17% 0.018 38)  — card bg
  bgChip:     '#241912',   // oklch(20% 0.02 38)   — subtle bg
  border:     '#2b1e17',   // oklch(22% 0.018 38)  — border
  borderLt:   '#3d2c22',   // oklch(28% 0.018 38)  — lighter border
  accent:     '#eb5927',   // oklch(65% 0.19 38)   — main accent
  accentDim:  'rgba(200,92,26,0.15)',
  text:       '#f0ebe7',   // oklch(93% 0.008 38)
  textDim:    '#9c9490',   // oklch(65% 0.012 38)
  success:    '#3ab55e',   // oklch(68% 0.16 148)
  successDim: 'rgba(58,181,94,0.15)',
  warning:    '#d4960e',   // oklch(76% 0.17 68)
  warningDim: 'rgba(212,150,14,0.15)',
  danger:     '#d84040',   // oklch(63% 0.21 22)
};

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function pct(val, prev) {
  if (prev == null || prev === 0) return null;
  return ((val - prev) / prev) * 100;
}

function trendBadge(delta, prevLabel) {
  if (delta == null || prevLabel == null) return '';
  const up = delta >= 0;
  const col = up ? C.success : C.danger;
  const bg  = up ? C.successDim : 'rgba(216,64,64,0.15)';
  const sym = up ? '▲' : '▼';
  return `<span style="display:inline-flex;align-items:center;gap:3px;background:${bg};color:${col};font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;letter-spacing:.01em">${sym} ${Math.abs(delta).toFixed(1)}% vs ${prevLabel}</span>`;
}

// Logo SVG (matches Sidebar.jsx)
const LOGO_SVG = `<svg width="22" height="22" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="16" fill="${C.accent}"/>
  <path d="M6 56 L6 40 L14 40 L14 26 L20 26 L20 36 L28 36 L28 20 L34 20 L34 30 L44 30 L44 14 L50 14 L50 26 L58 26 L58 56 Z" fill="white"/>
</svg>`;

function kpiCard(label, value, unit, delta, prevLabel, accentColor) {
  return `
    <div style="flex:1;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
      <div style="height:3px;background:${accentColor}"></div>
      <div style="padding:14px 16px 12px;display:flex;flex-direction:column;gap:6px">
        <div style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em">${label}</div>
        <div style="display:flex;align-items:baseline;gap:5px">
          <span style="font-size:32px;font-weight:800;color:${C.text};letter-spacing:-.03em;line-height:1">${value}</span>
          <span style="font-size:11px;color:${C.textDim};font-weight:600">${unit}</span>
        </div>
        <div>${trendBadge(delta, prevLabel)}</div>
      </div>
    </div>`;
}

function barChart(values, labels, color, title) {
  const maxVal = Math.max(...values, 0.001);
  const bars = values.map((v, i) => {
    const h = maxVal > 0 ? Math.max(Math.round((v / maxVal) * 75), v > 0 ? 3 : 0) : 0;
    const label = v > 0 ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : '';
    return `
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:3px">
        <span style="font-size:9px;font-weight:800;color:${C.text};min-height:12px;letter-spacing:-.01em">${label}</span>
        <div style="width:100%;display:flex;align-items:flex-end;height:75px">
          <div style="width:100%;height:${h}px;background:${color};border-radius:3px 3px 0 0"></div>
        </div>
        <span style="font-size:9px;color:${C.textDim};font-weight:600">${labels[i]}</span>
      </div>`;
  }).join('');

  return `
    <div style="flex:1;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
      <div style="padding:8px 12px;border-bottom:1px solid ${C.border}">
        <span style="color:${C.textDim};font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${title}</span>
      </div>
      <div style="padding:14px 12px 10px;display:flex;gap:6px;align-items:flex-end">
        ${bars}
      </div>
    </div>`;
}

function buildHTML(semana, prevSemana) {
  const dias = semana.dias || [];

  const totalVendas  = dias.reduce((s, d) => s + (Number(d.vendas)  || 0), 0);
  const totalEstoque = dias.reduce((s, d) => s + (Number(d.estoque) || 0), 0);
  const funcDias     = dias.filter(d => Number(d.qtdFunc) > 0);
  const mediaFunc    = funcDias.length
    ? funcDias.reduce((s, d) => s + Number(d.qtdFunc), 0) / funcDias.length : 0;
  const totalFornos  = countFornos(dias);

  let prevVendas = null, prevEstoque = null, prevFunc = null, prevFornos = null;
  if (prevSemana) {
    const pd = prevSemana.dias || [];
    prevVendas  = pd.reduce((s, d) => s + (Number(d.vendas)  || 0), 0);
    prevEstoque = pd.reduce((s, d) => s + (Number(d.estoque) || 0), 0);
    const pf    = pd.filter(d => Number(d.qtdFunc) > 0);
    prevFunc    = pf.length ? pf.reduce((s, d) => s + Number(d.qtdFunc), 0) / pf.length : 0;
    prevFornos  = countFornos(pd);
  }

  const prevLabel  = prevSemana ? `S${prevSemana.numero}` : null;
  const prevTotal  = prevVendas != null && prevEstoque != null ? prevVendas + prevEstoque : null;
  const dTotal     = pct(totalVendas + totalEstoque, prevTotal);
  const dVendas    = pct(totalVendas,  prevVendas);
  const dEstoque   = pct(totalEstoque, prevEstoque);
  const dFunc      = pct(mediaFunc,    prevFunc);
  const dFornos    = pct(totalFornos,  prevFornos);

  const vendasDia  = dias.map(d => Number(d.vendas)  || 0);
  const estoqueDia = dias.map(d => Number(d.estoque) || 0);
  const funcDia    = dias.map(d => Number(d.qtdFunc) || 0);
  const fornosDia  = dias.map(d => countFornos([d]));

  const start    = new Date(semana.dataInicio + 'T12:00:00');
  const end      = new Date(start); end.setDate(end.getDate() + 5);
  const fmtShort = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const fmtFull  = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const geradoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const metaPct  = Math.min(100, (totalFornos / Math.max(1, semana.meta)) * 100);
  const metaOk   = totalFornos >= semana.meta;
  const metaCol  = metaOk ? C.success : C.warning;

  // Variável do gerente
  const varMilheiros  = totalVendas * 1.0 + totalEstoque * 0.25;
  let varBonusFornos = 0;
  let varFaixaLabel  = null;
  if      (totalFornos >= 12) { varBonusFornos = 300; varFaixaLabel = '12+ fornos'; }
  else if (totalFornos >= 10) { varBonusFornos = 200; varFaixaLabel = '10–11 fornos'; }
  else if (totalFornos >= 8)  { varBonusFornos = 150; varFaixaLabel = '8–9 fornos'; }
  else if (totalFornos >= 6)  { varBonusFornos = 100; varFaixaLabel = '6–7 fornos'; }
  const varTotal = varMilheiros + varBonusFornos;
  const fmtBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const occs = dias
    .map((d, i) => ({ dia: DAY_LABELS[i], texto: d.ocorrencia }))
    .filter(o => o.texto && o.texto.trim());

  const occsHTML = occs.length === 0
    ? `<p style="color:${C.textDim};font-size:12px;font-style:italic;margin:0;padding:14px 16px">Nenhuma ocorrência registrada nesta semana.</p>`
    : occs.map(o => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-top:1px solid ${C.border}">
          <span style="background:${C.accent};color:#fff;font-size:9px;font-weight:800;padding:3px 8px;border-radius:4px;white-space:nowrap;letter-spacing:.04em">${o.dia}</span>
          <span style="font-size:12px;color:${C.text};line-height:1.5">${o.texto}</span>
        </div>`).join('');

  // Resumo operacional — peak values
  const picoPico    = dias.reduce((b, d, i) => { const v = Number(d.vendas)  || 0; return v > b.v ? { v, i } : b; }, { v: -1, i: -1 });
  const picoEst     = dias.reduce((b, d, i) => { const v = Number(d.estoque) || 0; return v > b.v ? { v, i } : b; }, { v: -1, i: -1 });
  const picoEnforna = dias.reduce((b, d, i) => { const n = Array.isArray(d.enfornas) ? d.enfornas.filter(e => e && e.trim()).length : 0; return n > b.n ? { n, i } : b; }, { n: -1, i: -1 });
  const picoFunc    = dias.reduce((b, d, i) => { const v = Number(d.qtdFunc) || 0; return v > b.v ? { v, i } : b; }, { v: -1, i: -1 });

  function resumoRow(label, show, day, val) {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid ${C.border}">
        <span style="font-size:12px;color:${C.textDim};font-weight:500">${label}</span>
        <span style="font-size:12px;font-weight:700;color:${show ? C.text : C.textDim}">${show ? `${day} · ${val}` : '—'}</span>
      </div>`;
  }

  const resumoHTML = [
    resumoRow('Pico de vendas',     picoPico.v    > 0, DAY_LABELS[picoPico.i],    `${picoPico.v.toFixed(1)} milh.`),
    resumoRow('Maior estoque',      picoEst.v     > 0, DAY_LABELS[picoEst.i],     `${picoEst.v.toFixed(1)} milh.`),
    resumoRow('Maior enfornamento', picoEnforna.n > 0, DAY_LABELS[picoEnforna.i], `${picoEnforna.n} fornos`),
    resumoRow('Equipe máxima',      picoFunc.v    > 0, DAY_LABELS[picoFunc.i],    `${picoFunc.v} funcs.`),
  ].join('');

  return `
    <div style="width:794px;font-family:'Segoe UI',system-ui,Arial,sans-serif;background:${C.bgMain};color:${C.text};padding:0">

      <!-- TOPBAR -->
      <div style="background:${C.bgDeep};padding:18px 24px 16px;display:flex;flex-direction:column;gap:0">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            ${LOGO_SVG}
            <span style="font-size:13px;font-weight:800;color:${C.text};letter-spacing:-.01em">FabricaLog</span>
          </div>
          <span style="background:${C.accentDim};border:1px solid ${C.accent};color:${C.accent};font-size:9px;font-weight:700;padding:3px 10px;border-radius:99px;letter-spacing:.06em">● FECHAMENTO</span>
        </div>
        <div style="font-size:17px;font-weight:800;color:${C.text};text-align:center;letter-spacing:-.02em">CONTROLE SEMANAL DE PRODUÇÃO</div>
        <div style="font-size:11px;color:${C.textDim};text-align:center;margin-top:5px;letter-spacing:.01em">
          Semana ${semana.numero} &nbsp;·&nbsp; ${fmtShort(start)} a ${fmtFull(end)} &nbsp;·&nbsp; Forno CEDAN
        </div>
        <div style="height:2px;background:${C.accent};margin-top:14px;border-radius:1px;opacity:.8"></div>
      </div>

      <div style="padding:20px 20px;display:flex;flex-direction:column;gap:14px">

        <!-- KPI CARDS -->
        <div style="display:flex;gap:10px">
          <!-- Card Total Geral -->
          <div style="flex:1;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
            <div style="height:3px;background:${C.success}"></div>
            <div style="padding:14px 16px 12px;display:flex;flex-direction:column;gap:6px">
              <div style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em">Total Geral</div>
              <div style="display:flex;align-items:baseline;gap:5px">
                <span style="font-size:32px;font-weight:800;color:${C.text};letter-spacing:-.03em;line-height:1">${(totalVendas + totalEstoque).toFixed(1)}</span>
                <span style="font-size:11px;color:${C.textDim};font-weight:600">mi</span>
              </div>
              <div>${trendBadge(dTotal, prevLabel)}</div>
              <div style="display:flex;gap:10px;margin-top:2px">
                <span style="font-size:10px;color:${C.success};font-weight:600">● ${totalVendas.toFixed(1)} vendas</span>
                <span style="font-size:10px;color:#3ab0b0;font-weight:600">● ${totalEstoque.toFixed(1)} estoque</span>
              </div>
            </div>
          </div>
          ${kpiCard('Média de Funcionários', mediaFunc.toFixed(1),    'func/dia',        dFunc,    prevLabel, C.warning)}
          ${kpiCard('Fornos Enfornados',     String(totalFornos),     `meta: ${semana.meta}`, dFornos, prevLabel, metaOk ? C.success : C.danger)}
        </div>

        <!-- META BAR -->
        <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;padding:12px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:10px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.07em">Meta de Fornos</span>
            <span style="font-size:12px;font-weight:800;color:${metaCol}">${totalFornos} / ${semana.meta} fornos &nbsp; ${metaPct.toFixed(0)}%</span>
          </div>
          <div style="background:${C.border};border-radius:99px;height:7px;overflow:hidden">
            <div style="background:${metaCol};width:${metaPct}%;height:100%;border-radius:99px"></div>
          </div>
          ${metaOk
            ? `<div style="font-size:10px;color:${C.success};font-weight:700;margin-top:6px">✓ Meta atingida</div>`
            : `<div style="font-size:10px;color:${C.textDim};margin-top:6px">${Math.max(0, semana.meta - totalFornos)} fornos abaixo da meta</div>`
          }
        </div>

        <!-- VARIÁVEL -->
        <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
          <div style="background:${C.bgDeep};padding:10px 16px;border-bottom:1px solid ${C.border};display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em">Variável</span>
            <span style="font-size:20px;font-weight:800;color:${C.success};letter-spacing:-.02em">${fmtBRL(varTotal)}</span>
          </div>
          <div style="display:flex;flex-direction:column">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid ${C.border}">
              <span style="font-size:11px;color:${C.textDim}">Vendas &nbsp;<span style="color:${C.text};font-weight:600">${totalVendas.toFixed(1)} mi</span> × R$1,00</span>
              <span style="font-size:12px;font-weight:700;color:${C.text}">${fmtBRL(totalVendas * 1.0)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid ${C.border}">
              <span style="font-size:11px;color:${C.textDim}">Estoque &nbsp;<span style="color:${C.text};font-weight:600">${totalEstoque.toFixed(1)} mi</span> × R$0,25</span>
              <span style="font-size:12px;font-weight:700;color:${C.text}">${fmtBRL(totalEstoque * 0.25)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px">
              <span style="font-size:11px;color:${C.textDim}">Fornos &nbsp;<span style="color:${C.text};font-weight:600">${totalFornos}${varFaixaLabel ? ` · faixa ${varFaixaLabel.replace(' fornos', '')}` : ''}</span></span>
              <span style="font-size:12px;font-weight:700;color:${varBonusFornos > 0 ? C.text : C.textDim}">${varBonusFornos > 0 ? fmtBRL(varBonusFornos) : '—'}</span>
            </div>
          </div>
        </div>

        <!-- CHARTS ROW 1 -->
        <div style="display:flex;gap:10px">
          ${barChart(vendasDia,  DAY_LABELS, C.success, 'Vendas Diárias (mi)')}
          ${barChart(estoqueDia, DAY_LABELS, '#3ab0b0', 'Estoque Diário (mi)')}
        </div>

        <!-- CHARTS ROW 2 -->
        <div style="display:flex;gap:10px">
          ${barChart(funcDia,   DAY_LABELS, C.warning, 'Funcionários por Dia')}
          ${barChart(fornosDia, DAY_LABELS, C.accent,  'Fornos Enfornados por Dia')}
        </div>

        <!-- BOTTOM ROW — Ocorrências + Resumo -->
        <div style="display:flex;gap:10px;align-items:flex-start">

          <!-- Ocorrências -->
          <div style="flex:1;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden;min-width:0">
            <div style="padding:9px 16px;border-bottom:1px solid ${C.border}">
              <span style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em">Ocorrências da Semana</span>
            </div>
            ${occsHTML}
          </div>

          <!-- Resumo operacional -->
          <div style="flex:1.4;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden;min-width:0">
            <div style="padding:9px 16px;border-bottom:1px solid ${C.border}">
              <span style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em">Resumo Operacional</span>
            </div>
            ${resumoHTML}
          </div>
        </div>

      </div>

      <!-- FOOTER -->
      <div style="background:${C.bgDeep};padding:10px 24px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid ${C.border}">
        <span style="font-size:9px;color:${C.textDim}">Forno CEDAN &nbsp;·&nbsp; Gerado em ${geradoEm} &nbsp;·&nbsp; Semana ${semana.numero}</span>
        <span style="font-size:9px;font-weight:800;color:${C.accent};letter-spacing:.04em">FABRICALOG</span>
      </div>

    </div>`;
}

// ── Helper: HTML → PDF ────────────────────────────────────────────────────────
async function htmlToPDF(html, filename) {
  const container = document.createElement('div');
  container.id = 'fabricalog-export-root';
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      useCORS: true,
      backgroundColor: C.bgMain,
      logging: false,
      onclone: (clonedDoc) => {
        Array.from(clonedDoc.styleSheets).forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            if (rules.some(r => r.cssText?.includes('oklch'))) sheet.ownerNode?.remove();
          } catch { /* cross-origin */ }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgW = 210;
    const imgH = (canvas.height * imgW) / canvas.width;

    const doc = new jsPDF({ unit: 'mm', format: [imgW, imgH] });
    doc.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    const { saveFile } = await import('../../utils/saveFile.js');
    const pdfBlob = doc.output('blob');
    await saveFile(pdfBlob, filename);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportDashboard(semana, prevSemana = null) {
  await htmlToPDF(buildHTML(semana, prevSemana), `dashboard_s${semana.numero}_${semana.dataInicio}.pdf`);
}

// ── Relatório Mensal ──────────────────────────────────────────────────────────
function buildMonthHTML(month, semanas) {
  const mSemanas = [...semanas].sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));

  const mVendas  = mSemanas.reduce((s, sem) => s + (sem.dias || []).reduce((a, d) => a + (Number(d.vendas)  || 0), 0), 0);
  const mEstoque = mSemanas.reduce((s, sem) => s + (sem.dias || []).reduce((a, d) => a + (Number(d.estoque) || 0), 0), 0);
  const mFornos  = mSemanas.reduce((s, sem) => s + countFornos(sem.dias || []), 0);
  const mMeta    = mSemanas.reduce((s, sem) => s + (sem.meta || 0), 0);
  const metaOk   = mFornos >= mMeta;
  const metaPct  = Math.min(100, (mFornos / Math.max(1, mMeta)) * 100);
  const metaCol  = metaOk ? C.success : C.warning;
  const geradoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const allOccs = mSemanas.flatMap(sem =>
    (sem.dias || []).map((d, i) => ({ semana: sem.numero, dia: DAY_LABELS[i], texto: d.ocorrencia }))
  ).filter(o => o.texto && o.texto.trim());

  const semanaCards = mSemanas.map(sem => {
    const dias  = sem.dias || [];
    const v     = dias.reduce((s, d) => s + (Number(d.vendas)  || 0), 0);
    const e     = dias.reduce((s, d) => s + (Number(d.estoque) || 0), 0);
    const f     = countFornos(dias);
    const ms    = sem.meta || 0;
    const ok    = f >= ms;
    const p     = Math.min(100, (f / Math.max(1, ms)) * 100);
    const start = new Date(sem.dataInicio + 'T12:00:00');
    const end   = new Date(start); end.setDate(end.getDate() + 5);
    const fmtD  = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `
      <div style="flex:1;min-width:140px;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
        <div style="background:${C.bgDeep};padding:7px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${C.border}">
          <span style="font-size:10px;font-weight:800;color:${C.text}">Semana ${sem.numero}</span>
          <span style="font-size:9px;color:${C.textDim}">${fmtD(start)}–${fmtD(end)}</span>
        </div>
        <div style="padding:10px 12px;display:flex;flex-direction:column;gap:5px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:9px;color:${C.textDim};text-transform:uppercase;letter-spacing:.04em">Vendas</span>
            <span style="font-size:11px;font-weight:700;color:${C.success}">${v.toFixed(1)} mi</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:9px;color:${C.textDim};text-transform:uppercase;letter-spacing:.04em">Estoque</span>
            <span style="font-size:11px;font-weight:700;color:#3ab0b0">${e.toFixed(1)} mi</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:9px;color:${C.textDim};text-transform:uppercase;letter-spacing:.04em">Fornos</span>
            <span style="font-size:11px;font-weight:700;color:${ok ? C.success : C.warning}">${f} / ${ms}</span>
          </div>
          <div style="background:${C.border};border-radius:99px;height:4px;margin-top:2px;overflow:hidden">
            <div style="background:${ok ? C.success : C.warning};width:${p}%;height:100%;border-radius:99px"></div>
          </div>
        </div>
      </div>`;
  }).join('');

  const semLabels  = mSemanas.map(s => `S${s.numero}`);
  const vendSerie  = mSemanas.map(s => (s.dias || []).reduce((a, d) => a + (Number(d.vendas)  || 0), 0));
  const estSerie   = mSemanas.map(s => (s.dias || []).reduce((a, d) => a + (Number(d.estoque) || 0), 0));
  const maxBarVal  = Math.max(...vendSerie, ...estSerie, 0.001);

  const dualBars = mSemanas.map((_, i) => {
    const vH = Math.max(Math.round((vendSerie[i] / maxBarVal) * 90), vendSerie[i] > 0 ? 2 : 0);
    const eH = Math.max(Math.round((estSerie[i]  / maxBarVal) * 90), estSerie[i]  > 0 ? 2 : 0);
    return `
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:2px">
        <div style="display:flex;align-items:flex-end;gap:3px;height:100px">
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <span style="font-size:8px;font-weight:700;color:${C.success}">${vendSerie[i].toFixed(1)}</span>
            <div style="width:16px;height:${vH}px;background:${C.success};border-radius:2px 2px 0 0"></div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <span style="font-size:8px;font-weight:700;color:#3ab0b0">${estSerie[i].toFixed(1)}</span>
            <div style="width:16px;height:${eH}px;background:#3ab0b0;border-radius:2px 2px 0 0"></div>
          </div>
        </div>
        <span style="font-size:9px;color:${C.textDim};font-weight:600">${semLabels[i]}</span>
      </div>`;
  }).join('');

  const occsHTML = allOccs.length === 0
    ? `<p style="color:${C.textDim};font-size:12px;font-style:italic;margin:0;padding:14px 16px">Nenhuma ocorrência registrada neste mês.</p>`
    : allOccs.map(o => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:9px 16px;border-top:1px solid ${C.border}">
          <span style="background:${C.bgChip};color:${C.text};font-size:9px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap;border:1px solid ${C.border}">S${o.semana}</span>
          <span style="background:${C.accent};color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap">${o.dia}</span>
          <span style="font-size:11px;color:${C.text};line-height:1.5">${o.texto}</span>
        </div>`).join('');

  return `
    <div style="width:794px;font-family:'Segoe UI',system-ui,Arial,sans-serif;background:${C.bgMain};color:${C.text};padding:0">

      <!-- TOPBAR -->
      <div style="background:${C.bgDeep};padding:18px 24px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            ${LOGO_SVG}
            <span style="font-size:13px;font-weight:800;color:${C.text};letter-spacing:-.01em">FabricaLog</span>
          </div>
          <span style="background:${C.accentDim};border:1px solid ${C.accent};color:${C.accent};font-size:9px;font-weight:700;padding:3px 10px;border-radius:99px;letter-spacing:.06em">● FECHAMENTO MENSAL</span>
        </div>
        <div style="font-size:17px;font-weight:800;color:${C.text};text-align:center;letter-spacing:-.02em">CONTROLE MENSAL DE PRODUÇÃO</div>
        <div style="font-size:11px;color:${C.textDim};text-align:center;margin-top:5px">
          ${month.label} &nbsp;·&nbsp; ${mSemanas.length} semanas &nbsp;·&nbsp; Forno CEDAN
        </div>
        <div style="height:2px;background:${C.accent};margin-top:14px;border-radius:1px;opacity:.8"></div>
      </div>

      <div style="padding:20px 20px;display:flex;flex-direction:column;gap:14px">

        <!-- TOTAIS -->
        <div style="display:flex;gap:10px">
          <div style="flex:1;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
            <div style="height:3px;background:${C.success}"></div>
            <div style="padding:14px 16px">
              <div style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Vendas do Mês</div>
              <div style="font-size:34px;font-weight:800;color:${C.text};letter-spacing:-.03em;line-height:1">${mVendas.toFixed(1)}</div>
              <div style="font-size:10px;color:${C.textDim};margin-top:4px">milheiros vendidos</div>
            </div>
          </div>
          <div style="flex:1;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
            <div style="height:3px;background:#3ab0b0"></div>
            <div style="padding:14px 16px">
              <div style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Total para Estoque</div>
              <div style="font-size:34px;font-weight:800;color:${C.text};letter-spacing:-.03em;line-height:1">${mEstoque.toFixed(1)}</div>
              <div style="font-size:10px;color:${C.textDim};margin-top:4px">milheiros em estoque</div>
            </div>
          </div>
          <div style="flex:1;background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
            <div style="height:3px;background:${metaCol}"></div>
            <div style="padding:14px 16px">
              <div style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Fornos / Meta</div>
              <div style="font-size:34px;font-weight:800;color:${metaCol};letter-spacing:-.03em;line-height:1">${mFornos}<span style="font-size:18px;color:${C.textDim}"> / ${mMeta}</span></div>
              <div style="font-size:10px;color:${C.textDim};margin-top:4px">${metaPct.toFixed(0)}% da meta atingida</div>
            </div>
          </div>
        </div>

        <!-- META BAR -->
        <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;padding:12px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:10px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.07em">Meta Total do Mês</span>
            <span style="font-size:12px;font-weight:800;color:${metaCol}">${mFornos} / ${mMeta} fornos &nbsp; ${metaPct.toFixed(0)}%</span>
          </div>
          <div style="background:${C.border};border-radius:99px;height:7px;overflow:hidden">
            <div style="background:${metaCol};width:${metaPct}%;height:100%;border-radius:99px"></div>
          </div>
        </div>

        <!-- CARDS POR SEMANA -->
        <div>
          <div style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Resumo por Semana</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">${semanaCards}</div>
        </div>

        <!-- GRÁFICO MENSAL -->
        <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
          <div style="padding:9px 16px;border-bottom:1px solid ${C.border}">
            <span style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em">Milheiros por Semana</span>
          </div>
          <div style="padding:16px 24px 12px">
            <div style="display:flex;gap:10px;align-items:flex-end;justify-content:center">${dualBars}</div>
            <div style="display:flex;gap:16px;justify-content:center;margin-top:10px">
              <span style="display:inline-flex;align-items:center;gap:5px;font-size:9px;color:${C.textDim}"><span style="width:10px;height:8px;background:${C.success};display:inline-block;border-radius:2px"></span>Vendas</span>
              <span style="display:inline-flex;align-items:center;gap:5px;font-size:9px;color:${C.textDim}"><span style="width:10px;height:8px;background:#3ab0b0;display:inline-block;border-radius:2px"></span>Estoque</span>
            </div>
          </div>
        </div>

        <!-- OCORRÊNCIAS -->
        <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden">
          <div style="padding:9px 16px;border-bottom:1px solid ${C.border}">
            <span style="font-size:9px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.08em">Ocorrências do Mês</span>
          </div>
          ${occsHTML}
        </div>

      </div>

      <!-- FOOTER -->
      <div style="background:${C.bgDeep};padding:10px 24px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid ${C.border}">
        <span style="font-size:9px;color:${C.textDim}">Forno CEDAN &nbsp;·&nbsp; Gerado em ${geradoEm} &nbsp;·&nbsp; ${month.label}</span>
        <span style="font-size:9px;font-weight:800;color:${C.accent};letter-spacing:.04em">FABRICALOG</span>
      </div>

    </div>`;
}

export async function exportDashboardMes(month) {
  const filename = `dashboard_${month.label.replace(/\s/g, '_').toLowerCase()}.pdf`;
  await htmlToPDF(buildMonthHTML(month, month.semanas), filename);
}
