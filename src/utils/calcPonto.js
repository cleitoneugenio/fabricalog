const DAYS     = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex'];

function isFullDay(v) { return v !== 'F' && v !== '' && v != null && Number(v) >= 50; }
function isWorked(v)  { return v !== 'F' && v !== '' && v != null; }

export function calcPonto(diasObj = {}) {
  let worked = 0;
  let wages  = 0;
  for (const d of DAYS) {
    const v = diasObj[d];
    if (isWorked(v)) { worked++; wages += Number(v) || 0; }
  }
  const weekdaysOk    = WEEKDAYS.every(d => isFullDay(diasObj[d]));
  const satWorked     = isWorked(diasObj.sab);
  const bonusEligible = weekdaysOk && satWorked;
  const bonusValor    = diasObj.bonus_valor ?? 25;
  const bonus = bonusEligible && !diasObj.bonus_bloqueado ? bonusValor : 0;
  return { dias: worked, bonus, bonusEligible, bonusValor, total: wages + bonus };
}
