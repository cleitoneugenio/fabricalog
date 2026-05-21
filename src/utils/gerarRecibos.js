import { calcPonto } from './calcPonto';
import { formatBRL } from './formatBRL';
import { valorPorExtenso } from './valorPorExtenso';

const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function dataExtenso(d = new Date()) {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

// Flui [{text, bold}] em linhas com quebra automática respeitando maxWidth
function flowRichText(doc, segments, maxWidth) {
  const lines = [];
  let line = [];
  let lineW = 0;

  for (const { text, bold } of segments) {
    const words = text.split(' ');
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      if (!word) continue;

      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const wordW = doc.getTextWidth(word);

      doc.setFont('helvetica', 'normal');
      const spaceW = doc.getTextWidth(' ');

      if (line.length > 0 && lineW + spaceW + wordW > maxWidth) {
        lines.push(line);
        line = [{ text: word, bold, width: wordW }];
        lineW = wordW;
      } else {
        if (line.length > 0) {
          line.push({ text: ' ', bold: false, width: spaceW });
          lineW += spaceW;
        }
        line.push({ text: word, bold, width: wordW });
        lineW += wordW;
      }
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

function drawRichText(doc, lines, x, y, lineHeight) {
  for (const tokens of lines) {
    let cx = x;
    for (const token of tokens) {
      doc.setFont('helvetica', token.bold ? 'bold' : 'normal');
      doc.text(token.text, cx, y);
      cx += token.width;
    }
    y += lineHeight;
  }
  return y;
}

export async function gerarRecibos(ponto, employees, settings) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PAGE_W  = 210;
  const PAGE_H  = 297;
  const ML      = 15;
  const MT      = 15;
  const MB      = 15;
  const CW      = PAGE_W - ML * 2;
  const PAD     = 6;
  const LINE_H  = 5;
  const FS      = 10;
  const FS_TTL  = 11;
  const innerW  = CW - PAD * 2;

  const dataHoje = dataExtenso();

  const funcionariosValidos = employees
    .map(emp => {
      const d = ponto.dias[emp.id] ?? {};
      const { total } = calcPonto(d);
      return { nome: emp.name, total };
    })
    .filter(f => f.total > 0);

  if (funcionariosValidos.length === 0) {
    throw new Error('Nenhum funcionário com valor a receber nesta semana.');
  }

  function buildSegments(func) {
    return [
      {
        text: `Recebi da empresa ${settings.empresa}, pessoa jurídica de direito privado, inscrita no CNPJ sob o n ${settings.cnpj}, com sede na cidade ${settings.endereco}, a quantia de `,
        bold: false,
      },
      { text: valorPorExtenso(func.total), bold: true },
      {
        text: ` . Referente a serviço de diárias no ${dataHoje}. dando-lhe por este recibo a devida quitação.`,
        bold: false,
      },
    ];
  }

  // Calcula altura total da caixa do recibo (sem renderizar)
  function calcBoxHeight(func) {
    doc.setFontSize(FS);
    const bodyLines = flowRichText(doc, buildSegments(func), innerW);
    return (
      PAD          // topo
      + 9          // linha do título
      + 4          // gap após título
      + bodyLines.length * LINE_H  // corpo
      + 5          // gap após corpo
      + LINE_H     // cidade/data
      + 12         // espaço antes da linha de assinatura
      + 4          // gap após linha de assinatura
      + LINE_H     // nome
      + PAD        // base
    );
  }

  let y = MT;

  function drawRecibo(func) {
    const boxH = calcBoxHeight(func);

    if (y + boxH > PAGE_H - MB) {
      doc.addPage();
      y = MT;
    }

    const boxX = ML;
    const boxY = y;
    const textX = boxX + PAD;

    // Caixa com borda
    doc.setLineWidth(0.3);
    doc.setDrawColor(160, 160, 160);
    doc.rect(boxX, boxY, CW, boxH, 'S');
    doc.setDrawColor(0, 0, 0);

    let cy = boxY + PAD;

    // Título (esquerda) + valor (direita) — negrito
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FS_TTL);
    doc.text('RECIBO DE PAGAMENTO', textX, cy + 5);
    doc.text(formatBRL(func.total), boxX + CW - PAD, cy + 5, { align: 'right' });
    cy += 9;
    cy += 4;

    // Corpo com negrito inline
    doc.setFontSize(FS);
    const segments = buildSegments(func);
    const bodyLines = flowRichText(doc, segments, innerW);
    cy = drawRichText(doc, bodyLines, textX, cy, LINE_H);
    cy += 5;

    // Cidade e data
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.cidade}, ${dataHoje}.`, textX, cy);
    cy += LINE_H;
    cy += 12;

    // Linha de assinatura centralizada (55% da largura interna)
    const sigW = innerW * 0.55;
    const sigX = textX + (innerW - sigW) / 2;
    doc.setLineWidth(0.4);
    doc.line(sigX, cy, sigX + sigW, cy);
    cy += 4;

    // Nome centralizado
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FS);
    const nomeW = doc.getTextWidth(func.nome);
    doc.text(func.nome, textX + (innerW - nomeW) / 2, cy);

    y = boxY + boxH + 5;
  }

  for (const func of funcionariosValidos) {
    drawRecibo(func);
  }

  const { saveFile } = await import('./saveFile.js');
  const fileName = `fabricalog-recibos-semana-${ponto.numero ?? ''}.pdf`;
  const pdfBlob  = doc.output('blob');
  await saveFile(pdfBlob, fileName);
}
