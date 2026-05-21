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
  const XLSX = await import('xlsx');
  const label = weekLabel(semana);
  const header = ['CATEGORIA', ...DAY_FULL_NAMES, 'TOTAL'];

  const rows = [
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
    row('Fornos Desocupados',  semana.dias, 'fornosDesocupados'),
    row('Reforma',             semana.dias, 'reforma'),
    row('Qtd. Funcionários',   semana.dias, 'qtdFunc'),
    ...ocorrenciaRows(semana.dias),
    ['Meta (Fornos)', ...Array(6).fill(''), semana.meta],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, ...Array(6).fill({ wch: 18 }), { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Semana ${semana.numero}`);

  const { saveFile } = await import('../../utils/saveFile.js');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  await saveFile(blob, `fabricalog-semana-${semana.numero}.xlsx`);
}
