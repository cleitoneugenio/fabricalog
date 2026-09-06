// Dados de demonstração — valores sintéticos, apenas para popular a interface

function d(seg, ter, qua, qui, sex, sab) {
  return { seg, ter, qua, qui, sex, sab };
}

// ─── SEMANAS ──────────────────────────────────────────────────────────────────

const S2 = {
  id: 's2', numero: 2, dataInicio: '2026-04-06', meta: 10,
  dias: [
    { queima: 'F11', enfornas: ['F16 (A e B)', '', ''],        qualidade: 'Pátio Seco',    estoque: 0,  vendas: 1.65, fornosDesocupados: '',                        reforma: '',              qtdFunc: 2, ocorrencia: '' },
    { queima: 'F12', enfornas: ['F17 (A e B)', '', ''],         qualidade: 'Pátio Molhado', estoque: 12, vendas: 7.5,  fornosDesocupados: 'F1 e metade do F2',        reforma: '',              qtdFunc: 7, ocorrencia: 'Dois funcionários saíram antes de concluir o forno' },
    { queima: 'F13', enfornas: ['F18 (A)', 'F1 (B e C)', ''],   qualidade: 'Pátio Seco',    estoque: 7,  vendas: 13.0, fornosDesocupados: 'F2 e faltando 1M p/ F3',   reforma: '',              qtdFunc: 5, ocorrencia: 'Caminhão de 18 milheiros; metade da equipe realocada para o contínuo' },
    { queima: 'F14', enfornas: ['F2 (A e B)', 'F3 (C e D)', ''], qualidade: 'Pátio Seco',   estoque: 0,  vendas: 12.0, fornosDesocupados: 'F4 faltando 2M',           reforma: '',              qtdFunc: 6, ocorrencia: 'Parte da tarde toda a turma foi para o outro forno' },
    { queima: 'F15', enfornas: ['F4 (A e B)', '', ''],          qualidade: 'Pátio Seco',    estoque: 16, vendas: 10.0, fornosDesocupados: 'F5 faltando metade do F7', reforma: 'F6 em reforma', qtdFunc: 8, ocorrencia: '' },
    { queima: 'F16', enfornas: ['F5 (A e B)', '', ''],          qualidade: 'Pátio Seco',    estoque: 23, vendas: 2.8,  fornosDesocupados: 'F7 e F8 e 2M de F9',       reforma: 'F6 em reforma', qtdFunc: 8, ocorrencia: '' },
  ],
};

const S3 = {
  id: 's3', numero: 3, dataInicio: '2026-04-13', meta: 10,
  dias: [
    { queima: 'F2',  enfornas: ['F7 (A e B)', '', ''],           qualidade: 'Pátio Seco',    estoque: 0,  vendas: 0,   fornosDesocupados: '',           reforma: 'F6 em reforma', qtdFunc: 0, ocorrencia: 'Muitas faltas; os presentes foram alocados no contínuo' },
    { queima: 'F3',  enfornas: ['F8 (A e B)', '', ''],           qualidade: 'Pátio Molhado', estoque: 20, vendas: 3.8, fornosDesocupados: 'F9',         reforma: 'F6 em reforma', qtdFunc: 6, ocorrencia: 'Dois fornos empreitados; parte da equipe realocada para entrega extra' },
    { queima: 'F4',  enfornas: ['F9 (A e B)', '', ''],           qualidade: 'Pátio Seco',    estoque: 24, vendas: 8.5, fornosDesocupados: 'F10 e F11',  reforma: '',              qtdFunc: 6, ocorrencia: 'Manhã com equipe reduzida, próximo do estoque; tarde com reforço' },
    { queima: 'F5',  enfornas: ['F10 (A e B)', 'F11 (C e D)', ''], qualidade: 'Secador',     estoque: 25, vendas: 7.0, fornosDesocupados: 'F12 e F13', reforma: '',              qtdFunc: 6, ocorrencia: '' },
    { queima: 'F6',  enfornas: ['F12 (A e B)', 'F13 (C e D)', ''], qualidade: 'Secador',     estoque: 12, vendas: 5.0, fornosDesocupados: 'F14',        reforma: '',              qtdFunc: 4, ocorrencia: '' },
    { queima: 'F7',  enfornas: ['F14 (A e B)', 'F15', ''],       qualidade: 'Pátio Molhado', estoque: 12, vendas: 4.3, fornosDesocupados: 'F15',        reforma: '',              qtdFunc: 0, ocorrencia: '' },
  ],
};

const S4 = {
  id: 's4', numero: 4, dataInicio: '2026-04-20', meta: 10,
  dias: [
    { queima: 'F10', enfornas: ['F15', '', ''],   qualidade: 'Pátio Molhado', estoque: 0,  vendas: 5.0,  fornosDesocupados: '',          reforma: '',               qtdFunc: 0, ocorrencia: 'Muitas faltas; equipe toda no contínuo para atender a demanda' },
    { queima: 'F11', enfornas: ['', '', ''],      qualidade: 'Pátio Seco',    estoque: 12, vendas: 4.5,  fornosDesocupados: '',          reforma: '',               qtdFunc: 6, ocorrencia: 'FERIADO' },
    { queima: 'F12', enfornas: ['F16', '', ''],   qualidade: 'Pátio Seco',    estoque: 22, vendas: 6.0,  fornosDesocupados: 'F17 e F18', reforma: 'F17 em reforma', qtdFunc: 8, ocorrencia: '' },
    { queima: '',    enfornas: ['F18', '', ''],   qualidade: 'Secador',       estoque: 25, vendas: 9.0,  fornosDesocupados: 'F1 e F2',   reforma: '',               qtdFunc: 6, ocorrencia: 'Reforma do F17 atrasou; enforna dupla adiada para não segurar a queima' },
    { queima: 'F13', enfornas: ['F1', 'F2', ''], qualidade: 'Pátio Seco',    estoque: 19, vendas: 15.0, fornosDesocupados: 'F3 e F4',   reforma: '',               qtdFunc: 8, ocorrencia: '' },
    { queima: '',    enfornas: ['F3', 'F4', ''], qualidade: 'Pátio Seco',    estoque: 0,  vendas: 10.0, fornosDesocupados: 'F5',        reforma: '',               qtdFunc: 5, ocorrencia: '' },
  ],
};

const S5 = {
  id: 's5', numero: 5, dataInicio: '2026-04-27', meta: 10,
  dias: [
    { queima: 'F17',   enfornas: ['F4 (A e B)', '', ''],                     qualidade: 'Pátio Seco', estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 6, ocorrencia: '' },
    { queima: 'F18',   enfornas: ['F5 (A e B)', 'F6 (C e D)', ''],           qualidade: 'Pátio Seco', estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 6, ocorrencia: 'Parte da tarde todos no contínuo' },
    { queima: 'F1/F2', enfornas: ['F7 (A e B)', '', ''],                     qualidade: 'Secador',    estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 0, ocorrencia: '' },
    { queima: 'F3',    enfornas: ['F8 (A e B)', '', ''],                     qualidade: 'Secador',    estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 0, ocorrencia: '' },
    { queima: 'F4',    enfornas: ['F9 (A e B)', 'F10 (C e D)', 'F11 (E e F)'], qualidade: 'Pátio Seco', estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 0, ocorrencia: '' },
    { queima: '',      enfornas: ['', '', ''],                               qualidade: 'Pátio Seco', estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 0, ocorrencia: '' },
  ],
};

// ─── PONTOS ───────────────────────────────────────────────────────────────────

// Ponto 1 — Semana 27/02 a 04/03/2026
const diasP1 = {
  e01: d( 90,  90,  90,  90,  75,  40),
  e02: d( '',  '',  '',  '',  '',  ''),
  e03: d( 90,  90,  90,  90,  75,  75),
  e04: d('F', 'F',  75, 'F', 120,  90),
  e05: d( 80,  90,  50,  50, 110,  50),
  e06: d( 75,  75,  75,  75,  75,  40),
  e07: d('F', 'F',  75,  75,  75, 'F'),
  e08: d( 75,  95,  75,  75,  75,  75),
  e09: d('F',  75,  75, 'F',  75,  75),
  e10: d( '',  '',  '',  '',  '',  ''),
  e11: d('F',  75,  75, 'F', 'F',  50),
  e12: d( 70,  70,  70,  70,  70,  35),
  e13: d( 75, 'F',  75,  80,  75,  75),
  e14: d( 40, 110,  90,  90,  75,  75),
  e15: d('F', 'F', 'F', 'F', 'F', 'F'),
  e16: d( 70,  35,  70,  70,  70,  70),
  e17: d( 75,  75,  75,  90,  95,  75),
  e18: d('F',  95,  75,  90,  95,  75),
  e19: d('F',  75,  75,  75,  75,  50),
  e20: d('F',  70,  70,  70,  70,  35),
  e21: d('F', 'F', 'F',  70,  70,  35),
  e22: d('F',  70,  70, 'F',  70,  35),
};

// Ponto 2 — Semana 06/04 a 11/04/2026
const diasP2 = {
  e01: d( 90,  55,  90, 'F',  85,  40),
  e02: d('F', 'F', 'F', 'F', 'F', 'F'),
  e03: d( 90,  90,  90,  90,  90,  90),
  e04: d('F',  55, 'F',  90,  85,  40),
  e05: d( 90,  90,  90,  90,  90,  90),
  e06: d('F',  80,  75,  80,  75,  40),
  e07: d('F',  75,  80,  80,  75,  75),
  e08: d( 75, 'F',  75,  75,  75,  35),
  e09: d( 75,  35,  75,  75, 'F',  35),
  e10: d('F', 'F',  75,  75, 'F', 'F'),
  e11: d( 75,  75,  80,  80,  75,  75),
  e12: d('F',  70,  70,  70,  85,  35),
  e13: d( 75,  75,  75,  80,  70,  35),
  e14: d( 85,  85, 'F',  75,  85,  75),
  e15: d('F',  85,  70,  35,  85,  70),
  e16: d( 35,  85,  70,  70,  85,  70),
  e17: d('F',  75, 'F',  90, 'F',  75),
  e18: d('F',  75, 'F',  75, 'F',  75),
  e19: d('F',  75,  75,  75,  75,  75),
  e20: d('',   '',  '',  '',  '',  ''),
  e21: d('',   '',  '',  '',  '',  ''),
  e22: d('',   '',  '',  '',  '',  ''),
};

// Ponto 3 — Semana 13/04 a 18/04/2026
const diasP3 = {
  e01: d( 40,  90, 'F',  90,  90,  40),
  e02: d('F', 'F', 'F', 'F', 'F', 'F'),
  e03: d( 90,  90,  90,  90,  90, 'F'),
  e04: d('F', 'F',   0,   0,   0,  40),
  e05: d( 90, 'F',  90,  90, 'F', 'F'),
  e06: d( 80,  75,  80,  75,  75,  40),
  e07: d('F', 'F', 'F',  75,  75,  40),
  e08: d('F',  75,  75,  75,  75,  75),
  e09: d('F',  35,  75,  75,  75,  35),
  e10: d('F',  75, 'F', 'F',  75, 'F'),
  e11: d('F',  75,  75,  75,  90,  40),
  e12: d('F', 'F', 'F', 'F', 'F', 'F'),
  e13: d('F',  75,  75,  75,  75,  40),
  e14: d('F', 'F',  80,  85,  75,  75),
  e15: d( 75,  70,  70,  85,  95,  70),
  e16: d( 75,  70,  70,  85,  95,  70),
  e17: d( 75,  70,  70,  80,  90,  70),
  e18: d( 75,  70,  70,  80,  70,  70),
  e19: d( 75,  70, 'F', 'F',  70,  35),
  e20: d('',   '',  '',  '',  '',  ''),
  e21: d('',   '',  '',  '',  '',  ''),
  e22: d('',   '',  '',  '',  '',  ''),
};

// Ponto 4 — Semana 20/04 a 25/04/2026
const diasP4 = {
  e01: d( 90, 'F',  90,  90,  90, 'F'),
  e02: d('F', 'F', 'F', 'F', 'F', 'F'),
  e03: d( 90,  75,  90,  90,  90, 110),
  e04: d('F', 'F',  75, 'F',  90, 'F'),
  e05: d( 35,  75,  75, 'F',  90,  75),
  e06: d('F',  75,  75,  75,  75,  75),
  e07: d('F',   0,  75,  90,  75,  75),
  e08: d( '',  75,  75,  35,  75, 'F'),
  e09: d('F', 'F',  75,  90,  85,  75),
  e10: d('F', 'F', 'F',  75,  75, 'F'),
  e11: d('F', 'F', 'F', 'F', 'F', 'F'),
  e12: d('F', 'F', 'F', 'F', 'F', 'F'),
  e13: d('F',  75,  75,  75,  75,  75),
  e14: d( 75,  75,  75,  90,  90,  75),
  e15: d( 40,  70,  80,  90,  35,  75),
  e16: d( 70,  70,  70,  90,  85,  70),
  e17: d( 35,  70,  70,  70,  70, 110),
  e18: d( 35,  70,  70,  70,  70,  70),
  e19: d( 75,  75,  75,  75,  75,  75),
  e20: d('',   '',  '',  '',  '',  ''),
  e21: d('',   '',  '',  '',  '',  ''),
  e22: d('',   '',  '',  '',  '',  ''),
};

const P1 = { id: 'p1', numero: 1, dataInicio: '2026-02-27', dias: diasP1 };
const P2 = { id: 'p2', numero: 2, dataInicio: '2026-04-06', dias: diasP2 };
const P3 = { id: 'p3', numero: 3, dataInicio: '2026-04-13', dias: diasP3 };
const P4 = { id: 'p4', numero: 4, dataInicio: '2026-04-20', dias: diasP4 };

export function seedAll(semanaStore, pontoStore) {
  semanaStore.replaceAll([S2, S3, S4, S5].map(s => ({ ...s, id: crypto.randomUUID() })));
  pontoStore.replaceAll([P1, P2, P3, P4].map(p => ({ ...p, id: crypto.randomUUID() })));
}
