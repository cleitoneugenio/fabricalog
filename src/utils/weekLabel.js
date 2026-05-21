export function weekLabel(semana) {
  if (!semana) return '';
  const start = new Date(semana.dataInicio + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 5);
  const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `S${semana.numero} — ${fmt(start)} a ${fmt(end)}`;
}

export function shortWeekLabel(semana) {
  if (!semana) return '';
  return `Sem. ${semana.numero}`;
}

// Retorna true se o sábado da semana já passou
export function isWeekPast(semana) {
  if (!semana?.dataInicio) return false;
  const sat = new Date(semana.dataInicio + 'T23:59:59');
  sat.setDate(sat.getDate() + 5);
  return sat < new Date();
}

export const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DAY_KEYS  = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export const DAY_FULL_NAMES = [
  'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira',
  'Quinta-Feira', 'Sexta-Feira', 'Sábado'
];
