import { describe, it, expect } from 'vitest';
import { mergeByUpdatedAt } from './syncMerge';

describe('mergeByUpdatedAt', () => {
  it('retorna array vazio quando ambos vazios', () => {
    expect(mergeByUpdatedAt([], [])).toEqual([]);
  });

  it('retorna itens apenas do local quando remote vazio', () => {
    const local = [{ id: '1', updatedAt: '2024-01-01', val: 'a' }];
    expect(mergeByUpdatedAt(local, [])).toEqual(local);
  });

  it('retorna itens apenas do remote quando local vazio', () => {
    const remote = [{ id: '1', updatedAt: '2024-01-01', val: 'a' }];
    expect(mergeByUpdatedAt([], remote)).toEqual(remote);
  });

  it('mantém versão local quando local é mais recente', () => {
    const local  = [{ id: '1', updatedAt: '2024-06-01', val: 'local' }];
    const remote = [{ id: '1', updatedAt: '2024-01-01', val: 'remote' }];
    const result = mergeByUpdatedAt(local, remote);
    expect(result).toHaveLength(1);
    expect(result[0].val).toBe('local');
  });

  it('sobrescreve com remote quando remote é mais recente', () => {
    const local  = [{ id: '1', updatedAt: '2024-01-01', val: 'local' }];
    const remote = [{ id: '1', updatedAt: '2024-06-01', val: 'remote' }];
    const result = mergeByUpdatedAt(local, remote);
    expect(result).toHaveLength(1);
    expect(result[0].val).toBe('remote');
  });

  it('mantém local quando remote não tem updatedAt (tratado como mais antigo)', () => {
    const local  = [{ id: '1', updatedAt: '2024-01-01', val: 'local' }];
    const remote = [{ id: '1', val: 'remote' }];
    const result = mergeByUpdatedAt(local, remote);
    expect(result[0].val).toBe('local');
  });

  it('mantém local quando ambos sem updatedAt (empate → local ganha)', () => {
    const local  = [{ id: '1', val: 'local' }];
    const remote = [{ id: '1', val: 'remote' }];
    const result = mergeByUpdatedAt(local, remote);
    expect(result[0].val).toBe('local');
  });

  it('preserva itens exclusivos de cada lado', () => {
    const local  = [{ id: '1', updatedAt: '2024-01-01', val: 'a' }];
    const remote = [{ id: '2', updatedAt: '2024-01-01', val: 'b' }];
    const result = mergeByUpdatedAt(local, remote);
    expect(result).toHaveLength(2);
    expect(result.find(x => x.id === '1').val).toBe('a');
    expect(result.find(x => x.id === '2').val).toBe('b');
  });

  it('merge correto com múltiplos itens misturados', () => {
    const local = [
      { id: '1', updatedAt: '2024-06-01', val: 'local_newer' },
      { id: '2', updatedAt: '2024-01-01', val: 'local_older' },
      { id: '3', updatedAt: '2024-01-01', val: 'only_local' },
    ];
    const remote = [
      { id: '1', updatedAt: '2024-01-01', val: 'remote_older' },
      { id: '2', updatedAt: '2024-06-01', val: 'remote_newer' },
      { id: '4', updatedAt: '2024-01-01', val: 'only_remote' },
    ];
    const result = mergeByUpdatedAt(local, remote);
    expect(result).toHaveLength(4);
    expect(result.find(x => x.id === '1').val).toBe('local_newer');
    expect(result.find(x => x.id === '2').val).toBe('remote_newer');
    expect(result.find(x => x.id === '3').val).toBe('only_local');
    expect(result.find(x => x.id === '4').val).toBe('only_remote');
  });
});
