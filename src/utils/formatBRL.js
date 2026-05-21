const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatBRL = (v) => fmt.format(v ?? 0);
export const formatNum = (v) => fmtNum.format(v ?? 0);
