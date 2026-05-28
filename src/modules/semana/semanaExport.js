import { weekLabel, DAY_FULL_NAMES } from '../../utils/weekLabel';

function row(label, dias, field) {
  const vals = dias.map(d => d[field] ?? '');
  const numeric = vals.every(v => v === '' || !isNaN(Number(v)));
  const total = numeric ? vals.reduce((acc, v) => acc + (Number(v) || 0), 0) : '';
  return [label, ...vals, total];
}

function ocorrenciaRows(dias) {
  return [['Ocorrências', ...dias.map(d => d.ocorrencia ?? ''), '']];
}

export async function exportSemana(semana) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Semana ${semana.numero}`);

  const label = weekLabel(semana);
  const header = ['CATEGORIA', ...DAY_FULL_NAMES, 'TOTAL'];

  const allRows = [
    [`CONTROLE SEMANAL DE PRODUÇÃO — FORNO CEDAN`],
    [`Semana: ${semana.numero} (${label})`],
    [],
    header,
    row('Queima', semana.dias, 'queima'),
    ['Enforna 1', ...semana.dias.map(d => (d.enfornas ?? [d.enforna ?? ''])[0] ?? ''), ''],
    ['Enforna 2', ...semana.dias.map(d => (d.enfornas ?? [])[1] ?? ''), ''],
    ['Enforna 3', ...semana.dias.map(d => (d.enfornas ?? [])[2] ?? ''), ''],
    row('Qual. do Tijolo',     semana.dias, 'qualidade'),
    row('Estoque (Milheiros)', semana.dias, 'estoque'),
    row('Vendas (Milheiros)',  semana.dias, 'vendas'),
    row('Pares de Luvas',      semana.dias, 'luvas'),
    row('Fornos Desocupados',  semana.dias, 'fornosDesocupados'),
    row('Reforma',             semana.dias, 'reforma'),
    row('Qtd. Funcionários',   semana.dias, 'qtdFunc'),
    ...ocorrenciaRows(semana.dias),
    ['Meta (Fornos)', ...Array(6).fill(''), semana.meta],
  ];

  allRows.forEach(r => ws.addRow(r));

  ws.columns = [
    { width: 22 },
    ...Array(6).fill({ width: 18 }),
    { width: 10 },
  ];

  const { saveFile } = await import('../../utils/saveFile.js');
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  await saveFile(blob, `fabricalog-semana-${semana.numero}.xlsx`);
}
