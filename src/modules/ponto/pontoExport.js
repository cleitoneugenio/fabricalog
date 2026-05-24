import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { calcPonto } from '../../utils/calcPonto';

// Hex equivalents — html2canvas não suporta oklch
const C = {
  bgNav:      '#100b07',
  bgMain:     '#180f0b',
  bgCard:     '#1e1410',
  bgChip:     '#241912',
  bgHover:    '#271a10',
  border:     '#2b1e17',
  accent:     '#eb5927',
  accentDim:  'rgba(235,89,39,0.13)',
  accentMid:  'rgba(235,89,39,0.18)',
  text:       '#f0ebe7',
  textDim:    '#9c9490',
  textSubtle: '#5c5450',
  danger:     '#d84040',
  dangerDim:  'rgba(216,64,64,0.13)',
  success:    '#3ab55e',
  successDim: 'rgba(58,181,94,0.13)',
  warning:    '#d4960e',
  warningDim: 'rgba(212,150,14,0.13)',
};

const DAY_KEYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

function fmt(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cellVal(v) {
  if (v === 'F' || v === 'f')
    return `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:24px;border-radius:5px;background:${C.dangerDim};color:${C.danger};font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;padding:0 5px">F</span>`;
  const n = Number(v);
  if (!isNaN(n) && n >= 120)
    return `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:24px;border-radius:5px;background:${C.accentMid};color:#f28054;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;padding:0 5px">${v}</span>`;
  if (!isNaN(n) && n > 0)
    return `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:24px;border-radius:5px;background:#2a1c16;color:${C.text};font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;padding:0 5px">${v}</span>`;
  return `<span style="color:${C.textSubtle};font-family:'JetBrains Mono',monospace;font-size:11px">—</span>`;
}

function diasBadge(d) {
  const bg  = d === 6 ? C.successDim : d === 5 ? C.accentDim : d === 4 ? C.warningDim : C.dangerDim;
  const col = d === 6 ? C.success    : d === 5 ? C.accent    : d === 4 ? C.warning    : C.danger;
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${bg};color:${col};font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700">${d}</span>`;
}

function bonusCell(bonus, bonusEligible, bloqueado) {
  if (bonus > 0)
    return `<span style="display:inline-flex;align-items:center;gap:3px;background:${C.successDim};color:${C.success};font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap">✓ ${fmtBRL(bonus)}</span>`;
  if (bonusEligible && bloqueado)
    return `<span style="display:inline-flex;align-items:center;gap:3px;background:${C.dangerDim};color:${C.danger};font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap">✕ bloqueado</span>`;
  return `<span style="color:${C.textSubtle};font-family:'JetBrains Mono',monospace;font-size:11px">—</span>`;
}

function buildHTML({ ponto, rows, period, year, totalFolha, totalDias, totalBonus,
                     semanaCompleta, ausenciaTotal, dayTotals }) {

  const rowsHTML = rows.map(r => {
    const opacity = r.dias === 0 ? 'opacity:0.4;' : '';
    return `
      <tr style="${opacity}border-bottom:1px solid ${C.border}">
        <td style="padding:9px 12px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;color:${C.textDim}">${r.id}</td>
        <td style="padding:9px 12px;font-weight:600;color:${C.text}">${r.name}</td>
        <td style="padding:9px 12px;text-align:center">${cellVal(r.seg)}</td>
        <td style="padding:9px 12px;text-align:center">${cellVal(r.ter)}</td>
        <td style="padding:9px 12px;text-align:center">${cellVal(r.qua)}</td>
        <td style="padding:9px 12px;text-align:center">${cellVal(r.qui)}</td>
        <td style="padding:9px 12px;text-align:center">${cellVal(r.sex)}</td>
        <td style="padding:9px 12px;text-align:center">${cellVal(r.sab)}</td>
        <td style="padding:9px 12px;text-align:center">${diasBadge(r.dias)}</td>
        <td style="padding:9px 12px;text-align:center">${bonusCell(r.bonus, r.bonusEligible, r.bloqueado)}</td>
        <td style="padding:9px 18px 9px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-weight:700;color:${C.accent}">${fmtBRL(r.total)}</td>
      </tr>`;
  }).join('');

  const totalRowHTML = `
    <tr style="background:${C.bgHover};border-top:2px solid ${C.accent}">
      <td style="padding:10px 12px"></td>
      <td style="padding:10px 12px;font-weight:800;text-transform:uppercase;font-size:10px;letter-spacing:0.08em;color:${C.text}">Total Geral</td>
      ${dayTotals.map(v => `<td style="padding:10px 12px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:11px;color:${C.textDim}">${v > 0 ? v.toLocaleString('pt-BR') : '—'}</td>`).join('')}
      <td style="padding:10px 12px;text-align:center"><span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:${C.text}">${totalDias}</span></td>
      <td style="padding:10px 12px;text-align:center"><span style="display:inline-flex;align-items:center;gap:3px;background:${C.successDim};color:${C.success};font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px">${fmtBRL(totalBonus)}</span></td>
      <td style="padding:10px 18px 10px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:13px;color:${C.accent}">${fmtBRL(totalFolha)}</td>
    </tr>`;

  const geradoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return `
    <div style="background:${C.bgMain};font-family:'Syne',system-ui,sans-serif;width:1100px">

      <!-- TOPBAR -->
      <div style="background:${C.bgNav};border-bottom:1px solid ${C.border};padding:14px 28px;display:flex;align-items:center;gap:12px">
        <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="14" fill="${C.accent}"/>
          <path d="M6 56 L6 40 L14 40 L14 26 L20 26 L20 36 L28 36 L28 20 L34 20 L34 30 L44 30 L44 14 L50 14 L50 26 L58 26 L58 56 Z" fill="white"/>
        </svg>
        <div style="font-size:14px;font-weight:800;letter-spacing:-0.02em;color:${C.text}">FabricaLog</div>
        <div style="flex:1"></div>
        <span style="background:${C.warningDim};color:${C.warning};font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:4px 14px;border-radius:99px;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap">
          Semana ${ponto.numero}
        </span>
      </div>

      <!-- PAGE -->
      <div style="padding:24px 28px 36px">

        <!-- HEAD -->
        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-size:10px;color:${C.accent};text-transform:uppercase;letter-spacing:0.14em;font-weight:700;margin-bottom:4px">Controle de Ponto</div>
            <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${C.text}">Folha de Pagamento Semanal</div>
          </div>
          <div style="display:flex;gap:20px">
            <div><div style="font-size:9px;color:${C.textSubtle};text-transform:uppercase;letter-spacing:0.1em">Período</div><div style="font-size:12px;font-weight:600;font-family:'JetBrains Mono',monospace;color:${C.text}">${period}</div></div>
            <div><div style="font-size:9px;color:${C.textSubtle};text-transform:uppercase;letter-spacing:0.1em">Semana</div><div style="font-size:12px;font-weight:600;font-family:'JetBrains Mono',monospace;color:${C.text}">S${ponto.numero} / ${year}</div></div>
          </div>
        </div>

        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:12px;overflow:hidden">
            <div style="height:3px;background:${C.accent}"></div>
            <div style="padding:14px 16px">
              <div style="font-size:9px;color:${C.textDim};text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Folha Total</div>
              <div style="font-size:26px;font-weight:800;letter-spacing:-0.03em;color:${C.text};margin-top:4px;line-height:1">${fmtBRL(totalFolha)}</div>
              <div style="font-size:10px;color:${C.textSubtle};margin-top:6px;font-family:'JetBrains Mono',monospace">${rows.length} funcionários</div>
            </div>
          </div>
          <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:12px;overflow:hidden">
            <div style="height:3px;background:${C.success}"></div>
            <div style="padding:14px 16px">
              <div style="font-size:9px;color:${C.textDim};text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Total Bônus</div>
              <div style="font-size:26px;font-weight:800;letter-spacing:-0.03em;color:${C.text};margin-top:4px;line-height:1">${fmtBRL(totalBonus)}</div>
              <div style="font-size:10px;color:${C.textSubtle};margin-top:6px;font-family:'JetBrains Mono',monospace">${rows.filter(r => r.bonus > 0).length} colaboradores</div>
            </div>
          </div>
          <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:12px;overflow:hidden">
            <div style="height:3px;background:${C.accent}"></div>
            <div style="padding:14px 16px">
              <div style="font-size:9px;color:${C.textDim};text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Semana Completa</div>
              <div style="font-size:26px;font-weight:800;letter-spacing:-0.03em;color:${C.text};margin-top:4px;line-height:1">${semanaCompleta}<span style="font-size:12px;color:${C.textDim};font-weight:500;margin-left:4px">func.</span></div>
              <div style="font-size:10px;color:${C.textSubtle};margin-top:6px;font-family:'JetBrains Mono',monospace">Seg–Sex + Sáb</div>
            </div>
          </div>
          <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:12px;overflow:hidden">
            <div style="height:3px;background:${C.danger}"></div>
            <div style="padding:14px 16px">
              <div style="font-size:9px;color:${C.textDim};text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Ausência Total</div>
              <div style="font-size:26px;font-weight:800;letter-spacing:-0.03em;color:${C.text};margin-top:4px;line-height:1">${ausenciaTotal}<span style="font-size:12px;color:${C.textDim};font-weight:500;margin-left:4px">func.</span></div>
              <div style="font-size:10px;color:${C.textSubtle};margin-top:6px;font-family:'JetBrains Mono',monospace">0 dias presentes</div>
            </div>
          </div>
        </div>

        <!-- TABELA -->
        <div style="background:${C.bgCard};border:1px solid ${C.border};border-radius:14px;overflow:hidden">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:${C.bgNav}">
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">#</th>
                <th style="padding:10px 12px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Funcionário</th>
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Seg</th>
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Ter</th>
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Qua</th>
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Qui</th>
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Sex</th>
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Sáb</th>
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Dias</th>
                <th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Bônus</th>
                <th style="padding:10px 18px 10px 12px;text-align:right;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border}">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
              ${totalRowHTML}
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <div style="margin-top:16px;display:flex;justify-content:space-between;font-size:10px;color:${C.textSubtle};font-family:'JetBrains Mono',monospace">
          <span>Controle de Ponto Semanal &nbsp;·&nbsp; Gerado em ${geradoEm}</span>
          <span>Semana ${ponto.numero} · ${period}/${year}</span>
        </div>

      </div>
    </div>`;
}

async function htmlToPDF(html, filename) {
  const iframe = document.createElement('iframe');
  // Altura grande o suficiente para o layout nunca ser truncado
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1100px;height:9999px;border:none;visibility:hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
<style>*{box-sizing:border-box}html,body{margin:0;padding:0;background:${C.bgMain}}</style>
</head><body>${html}</body></html>`);
  iframeDoc.close();

  // Aguarda Syne/JetBrains Mono carregarem (servidas do cache do browser)
  await iframeDoc.fonts.ready;

  const contentEl = iframeDoc.body.firstElementChild;
  const contentW  = 1100;

  // Mede a altura real pelo maior valor disponível
  const contentH = Math.max(
    contentEl.scrollHeight,
    contentEl.offsetHeight,
    iframeDoc.body.scrollHeight,
    iframeDoc.documentElement.scrollHeight,
  );

  // Ajusta iframe e aguarda reflow completo
  iframe.style.height = (contentH + 100) + 'px';
  await new Promise(r => setTimeout(r, 100));

  // Re-mede após reflow com o novo tamanho
  const finalH = Math.max(
    contentEl.scrollHeight,
    contentEl.offsetHeight,
    iframeDoc.body.scrollHeight,
  );

  try {
    const canvas = await html2canvas(contentEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: C.bgMain,
      logging: false,
      width:        contentW,
      height:       finalH,
      windowWidth:  contentW,
      windowHeight: finalH,
      x: 0,
      y: 0,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgW = 297;
    const imgH = (canvas.height * imgW) / canvas.width;

    const pdf = new jsPDF({ unit: 'mm', format: [imgW, imgH] });
    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);

    const { saveFile } = await import('../../utils/saveFile.js');
    const pdfBlob = pdf.output('blob');
    await saveFile(pdfBlob, filename);
  } finally {
    document.body.removeChild(iframe);
  }
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
  const semanaCompleta = rows.filter(r => r.bonus > 0).length;
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

  await htmlToPDF(
    buildHTML({ ponto, rows, period, year, totalFolha, totalDias, totalBonus, semanaCompleta, ausenciaTotal, dayTotals }),
    `fabricalog-ponto-semana-${ponto.numero}.pdf`,
  );
}
