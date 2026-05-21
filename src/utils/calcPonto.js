const DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export function calcPonto(diasObj = {}) {
  let worked = 0;
  let wages = 0;
  for (const d of DAYS) {
    const v = diasObj[d];
    if (v !== 'F' && v !== '' && v != null) {
      worked++;
      wages += Number(v) || 0;
    }
  }
  const bonusEligible = worked >= 6;
  const bonus = bonusEligible && !diasObj.bonus_bloqueado ? 25 : 0;
  return { dias: worked, bonus, bonusEligible, total: wages + bonus };
}
