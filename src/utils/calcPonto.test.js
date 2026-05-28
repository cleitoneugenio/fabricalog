import { describe, it, expect } from 'vitest';
import { calcPonto } from './calcPonto';

// isWorked(v): v !== 'F' && v !== '' && v != null  (0 CONTA como trabalhado)
// isFullDay(v): isWorked(v) && Number(v) >= 50     (usado para bonusEligible nos dias úteis)

describe('calcPonto', () => {
  it('retorna zeros para objeto vazio', () => {
    const r = calcPonto({});
    expect(r.dias).toBe(0);
    expect(r.bonus).toBe(0);
    expect(r.total).toBe(0);
  });

  it('conta 6 dias trabalhados em semana completa (220h)', () => {
    const r = calcPonto({ seg: 220, ter: 220, qua: 220, qui: 220, sex: 220, sab: 220 });
    expect(r.dias).toBe(6);
  });

  it('não conta falta "F" como trabalhado', () => {
    const r = calcPonto({ seg: 'F', ter: 220, qua: 220, qui: 220, sex: 220, sab: 220 });
    expect(r.dias).toBe(5);
  });

  it('não conta string vazia como trabalhado', () => {
    const r = calcPonto({ seg: '', ter: 220, qua: 220, qui: 220, sex: 220, sab: 220 });
    expect(r.dias).toBe(5);
  });

  it('conta 0 como dia trabalhado (isWorked: 0 ≠ "" ≠ "F")', () => {
    const r = calcPonto({ seg: 0, ter: 220, qua: 220, qui: 220, sex: 220, sab: 220 });
    expect(r.dias).toBe(6); // seg=0 → isWorked=true
    // seg=0 → isFullDay=false → bonusEligible=false
    expect(r.bonusEligible).toBe(false);
  });

  it('soma salários corretamente', () => {
    const r = calcPonto({ seg: 100, ter: 150, qua: 200, qui: 100, sex: 50, sab: 0 });
    // sab=0 → isWorked=true, satWorked=true; todos dias úteis ≥ 50 → bonusEligible=true
    expect(r.total - r.bonus).toBe(600);
    expect(r.bonus).toBe(25); // bonusEligible=true
    expect(r.total).toBe(625);
  });

  it('concede bônus padrão de 25 quando semana completa (todos dias úteis ≥ 50 + sab trabalhado)', () => {
    const r = calcPonto({ seg: 220, ter: 220, qua: 220, qui: 220, sex: 220, sab: 220 });
    expect(r.bonusEligible).toBe(true);
    expect(r.bonus).toBe(25);
    expect(r.total).toBe(6 * 220 + 25);
  });

  it('não concede bônus quando sábado não trabalhado (string vazia)', () => {
    const r = calcPonto({ seg: 220, ter: 220, qua: 220, qui: 220, sex: 220, sab: '' });
    expect(r.bonusEligible).toBe(false);
    expect(r.bonus).toBe(0);
  });

  it('não concede bônus quando falta em dia útil', () => {
    const r = calcPonto({ seg: 'F', ter: 220, qua: 220, qui: 220, sex: 220, sab: 220 });
    expect(r.bonusEligible).toBe(false);
    expect(r.bonus).toBe(0);
  });

  it('não concede bônus quando dia útil < 50 (meia diária)', () => {
    const r = calcPonto({ seg: 40, ter: 220, qua: 220, qui: 220, sex: 220, sab: 220 });
    expect(r.bonusEligible).toBe(false);
    expect(r.bonus).toBe(0);
  });

  it('usa bonus_valor customizado quando definido', () => {
    const r = calcPonto({ seg: 220, ter: 220, qua: 220, qui: 220, sex: 220, sab: 220, bonus_valor: 50 });
    expect(r.bonusValor).toBe(50);
    expect(r.bonus).toBe(50);
    expect(r.total).toBe(6 * 220 + 50);
  });

  it('bloqueia bônus quando bonus_bloqueado = true (elegível mas bloqueado)', () => {
    const r = calcPonto({ seg: 220, ter: 220, qua: 220, qui: 220, sex: 220, sab: 220, bonus_bloqueado: true });
    expect(r.bonusEligible).toBe(true);
    expect(r.bonus).toBe(0);
    expect(r.total).toBe(6 * 220); // sem bônus
  });

  it('trata valores string numéricos como números', () => {
    const r = calcPonto({ seg: '220', ter: '220', qua: '220', qui: '220', sex: '220', sab: '220' });
    expect(r.dias).toBe(6);
    expect(r.total).toBe(6 * 220 + 25);
  });

  it('bonusValor padrão é 25 quando não definido', () => {
    const r = calcPonto({ seg: 220, ter: 220, qua: 220, qui: 220, sex: 220, sab: 220 });
    expect(r.bonusValor).toBe(25);
  });
});
