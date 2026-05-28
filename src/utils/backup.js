function isValidSemana(s) {
  return s && typeof s.id === 'string' && typeof s.numero === 'number'
    && typeof s.dataInicio === 'string' && Array.isArray(s.dias);
}

function isValidPonto(p) {
  return p && typeof p.id === 'string' && typeof p.numero === 'number'
    && typeof p.dataInicio === 'string' && p.dias !== null && typeof p.dias === 'object';
}

function isValidEmployee(e) {
  return e && typeof e.id === 'string' && typeof e.name === 'string';
}

/**
 * Valida e retorna um objeto de backup já parseado.
 * Função pura — sem dependência de FileReader. Testável em Node/vitest.
 * @throws {Error} mensagem descritiva em caso de formato inválido
 */
export function parseBackupData(data) {
  if (!Array.isArray(data.semanas) || !Array.isArray(data.pontos)) {
    throw new Error('Formato de backup inválido');
  }
  if (!data.semanas.every(isValidSemana)) {
    throw new Error('Semanas com formato inválido no backup');
  }
  if (!data.pontos.every(isValidPonto)) {
    throw new Error('Pontos com formato inválido no backup');
  }
  if (data.employees !== undefined) {
    if (!Array.isArray(data.employees) || !data.employees.every(isValidEmployee)) {
      throw new Error('Funcionários com formato inválido no backup');
    }
  }
  if (data.carregamentos !== undefined && !Array.isArray(data.carregamentos)) {
    throw new Error('Carregamentos com formato inválido no backup');
  }
  return data;
}

export async function exportBackup(semanas, pontos, employees, settings, carregamentos = [], { silent = false } = {}) {
  const { saveFile } = await import('./saveFile.js');
  const payload = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    semanas,
    pontos,
    employees,
    settings,
    carregamentos,
  }, null, 2);

  const blob = new Blob([payload], { type: 'application/json' });
  await saveFile(blob, `fabricalog-backup-${new Date().toISOString().slice(0, 10)}.json`, { silent });
}

export function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(parseBackupData(data));
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Arquivo JSON inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}
