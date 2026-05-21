export function countFornos(dias) {
  return (dias || []).reduce((acc, d) => {
    const enfornas = d.enfornas ?? (d.enforna ? [d.enforna] : []);
    return acc + enfornas.filter(e => e && e.trim()).length;
  }, 0);
}

export function totalVendasSemana(dias) {
  return (dias || []).reduce((acc, d) => acc + (Number(d.vendas) || 0), 0);
}
