import { describe, it, expect } from 'vitest';
import { parseBackupData } from './backup';

// parseBackupData é uma função pura que recebe o objeto já deserializado.
// parseBackupFile envolve FileReader (browser API) e é coberta implicitamente.

const VALID_SEMANA = { id: 'uuid-1', numero: 1, dataInicio: '2024-01-01', dias: [] };
const VALID_PONTO  = { id: 'uuid-2', numero: 1, dataInicio: '2024-01-01', dias: {} };
const VALID_EMP    = { id: 'uuid-3', name: 'João' };

describe('parseBackupData', () => {
  it('aceita backup válido mínimo', () => {
    const data = parseBackupData({ semanas: [VALID_SEMANA], pontos: [VALID_PONTO] });
    expect(data.semanas).toHaveLength(1);
    expect(data.pontos).toHaveLength(1);
  });

  it('aceita backup com employees e carregamentos', () => {
    const data = parseBackupData({
      semanas: [VALID_SEMANA],
      pontos: [VALID_PONTO],
      employees: [VALID_EMP],
      carregamentos: [{ id: 'c1', data: '2024-01-01', qtd: 10 }],
    });
    expect(data.employees).toHaveLength(1);
    expect(data.carregamentos).toHaveLength(1);
  });

  it('aceita semanas e pontos como arrays vazios', () => {
    expect(() => parseBackupData({ semanas: [], pontos: [] })).not.toThrow();
  });

  it('rejeita quando semanas não é array', () => {
    expect(() => parseBackupData({ semanas: 'errado', pontos: [] }))
      .toThrow('Formato de backup inválido');
  });

  it('rejeita quando pontos não é array', () => {
    expect(() => parseBackupData({ semanas: [], pontos: null }))
      .toThrow('Formato de backup inválido');
  });

  it('rejeita semana sem id', () => {
    expect(() => parseBackupData({
      semanas: [{ numero: 1, dataInicio: '2024-01-01', dias: [] }],
      pontos: [],
    })).toThrow('Semanas com formato inválido');
  });

  it('rejeita semana com numero não-numérico', () => {
    expect(() => parseBackupData({
      semanas: [{ id: 'x', numero: 'um', dataInicio: '2024-01-01', dias: [] }],
      pontos: [],
    })).toThrow('Semanas com formato inválido');
  });

  it('rejeita semana sem dias', () => {
    expect(() => parseBackupData({
      semanas: [{ id: 'x', numero: 1, dataInicio: '2024-01-01' }],
      pontos: [],
    })).toThrow('Semanas com formato inválido');
  });

  it('rejeita employee sem name', () => {
    expect(() => parseBackupData({
      semanas: [VALID_SEMANA],
      pontos: [VALID_PONTO],
      employees: [{ id: 'x' }],
    })).toThrow('Funcionários com formato inválido');
  });

  it('rejeita carregamentos que não é array', () => {
    expect(() => parseBackupData({
      semanas: [VALID_SEMANA],
      pontos: [VALID_PONTO],
      carregamentos: 'errado',
    })).toThrow('Carregamentos com formato inválido');
  });

  it('aceita employees com campo updatedAt (novo formato)', () => {
    const data = parseBackupData({
      semanas: [VALID_SEMANA],
      pontos: [VALID_PONTO],
      employees: [{ id: 'x', name: 'João', updatedAt: '2024-01-01T00:00:00.000Z' }],
    });
    expect(data.employees[0].updatedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('aceita employees com campo ativo (soft-delete)', () => {
    const data = parseBackupData({
      semanas: [VALID_SEMANA],
      pontos: [VALID_PONTO],
      employees: [{ id: 'x', name: 'João', ativo: false }],
    });
    expect(data.employees[0].ativo).toBe(false);
  });
});
