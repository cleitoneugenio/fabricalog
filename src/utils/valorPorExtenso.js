const UNIDADES = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze',
  'dezesseis', 'dezessete', 'dezoito', 'dezenove',
];
const DEZENAS  = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function numExtenso(n) {
  if (n === 0) return 'zero';
  const partes = [];

  if (n >= 1_000_000) {
    const m = Math.floor(n / 1_000_000);
    partes.push(numExtenso(m) + (m === 1 ? ' milhão' : ' milhões'));
    n %= 1_000_000;
  }
  if (n >= 1_000) {
    const mil = Math.floor(n / 1_000);
    partes.push(mil === 1 ? 'mil' : numExtenso(mil) + ' mil');
    n %= 1_000;
  }
  if (n >= 100) {
    const c = Math.floor(n / 100);
    const resto = n % 100;
    partes.push(c === 1 && resto > 0 ? 'cento' : CENTENAS[c]);
    n = resto;
  }
  if (n >= 20) {
    partes.push(DEZENAS[Math.floor(n / 10)]);
    n %= 10;
  }
  if (n > 0) partes.push(UNIDADES[n]);

  return partes.join(' e ');
}

function fmtBRL(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function valorPorExtenso(valor) {
  const reais     = Math.floor(valor);
  const centavos  = Math.round((valor - reais) * 100);
  let extenso = numExtenso(reais) + (reais === 1 ? ' real' : ' reais');
  if (centavos > 0) extenso += ' e ' + numExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  return `${fmtBRL(valor)} (${extenso})`;
}
