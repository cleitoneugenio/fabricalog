export function calcVariavel({ totalVendas, totalEstoque, totalFornos }) {
  const milheiros = totalVendas * 1.0 + totalEstoque * 0.25;

  let bonusFornos = 0;
  if (totalFornos >= 12)      bonusFornos = 300;
  else if (totalFornos >= 10) bonusFornos = 200;
  else if (totalFornos >= 8)  bonusFornos = 150;
  else if (totalFornos >= 6)  bonusFornos = 100;

  return {
    milheiros,
    bonusFornos,
    total: milheiros + bonusFornos,
  };
}
