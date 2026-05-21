// Dados reais importados das planilhas Excel do Forno CEDAN

function d(seg, ter, qua, qui, sex, sab) {
  return { seg, ter, qua, qui, sex, sab };
}

// ─── SEMANAS ──────────────────────────────────────────────────────────────────

const S2 = {
  id: 's2', numero: 2, dataInicio: '2026-04-06', meta: 10,
  dias: [
    { queima: 'F11', enfornas: ['F16 (R, I e JV)', '', ''],         qualidade: 'Pátio Seco',    estoque: 0,  vendas: 1.65, fornosDesocupados: '',                         reforma: '',             qtdFunc: 2, ocorrencia: '' },
    { queima: 'F12', enfornas: ['F17 (R e JV)', '', ''],             qualidade: 'Pátio Molhado', estoque: 12, vendas: 7.5,  fornosDesocupados: 'F1 e metade do F2',         reforma: '',             qtdFunc: 7, ocorrencia: 'Ítalo e Diego foram embora sem concluir o forno' },
    { queima: 'F13', enfornas: ['F18 (I)', 'F1 (R e JV)', ''],       qualidade: 'Pátio Seco',    estoque: 7,  vendas: 13.0, fornosDesocupados: 'F2 e faltando 1M p/ F3',    reforma: '',             qtdFunc: 5, ocorrencia: 'Caminhão de 18 milheiros. Tive que levar metade dos funcionários para o contínuo' },
    { queima: 'F14', enfornas: ['F2 (R e JV)', 'F3 (D E G)', ''],    qualidade: 'Pátio Seco',    estoque: 0,  vendas: 12.0, fornosDesocupados: 'F4 faltando 2M',            reforma: '',             qtdFunc: 6, ocorrencia: 'Parte da tarde toda turma foi para o outro forno' },
    { queima: 'F15', enfornas: ['F4 (R e JV)', '', ''],               qualidade: 'Pátio Seco',    estoque: 16, vendas: 10.0, fornosDesocupados: 'F5 faltando metade do F7',  reforma: 'F6 em reforma', qtdFunc: 8, ocorrencia: '' },
    { queima: 'F16', enfornas: ['F5 (R e JV)', '', ''],               qualidade: 'Pátio Seco',    estoque: 23, vendas: 2.8,  fornosDesocupados: 'F7 e F8 e 2M de F9',       reforma: 'F6 em reforma', qtdFunc: 8, ocorrencia: '' },
  ],
};

const S3 = {
  id: 's3', numero: 3, dataInicio: '2026-04-13', meta: 10,
  dias: [
    { queima: 'F2',  enfornas: ['F7 (R e JV)', '', ''],              qualidade: 'Pátio Seco',    estoque: 0,  vendas: 0,   fornosDesocupados: '',           reforma: 'F6 em reforma', qtdFunc: 0, ocorrencia: 'Faltou muitos funcionarios, Os que vieram tivemos que alocar para o continuo' },
    { queima: 'F3',  enfornas: ['F8 (R e I)', '', ''],                qualidade: 'Pátio Molhado', estoque: 20, vendas: 3.8, fornosDesocupados: 'F9',         reforma: 'F6 em reforma', qtdFunc: 6, ocorrencia: 'Estava com dois forno empeleitados, Edvan tirou os quatro para fazer entrega extra' },
    { queima: 'F4',  enfornas: ['F9 (R E JV)', '', ''],               qualidade: 'Pátio Seco',    estoque: 24, vendas: 8.5, fornosDesocupados: 'F10 e F11',  reforma: '',              qtdFunc: 6, ocorrencia: 'Parte da manha fique somente com quatro pessoas mas estava bem proximo do estoque, E parte da tarde deu para alocar mais funcionarios' },
    { queima: 'F5',  enfornas: ['F10 (R e I)', 'F11 (G e JV)', ''],   qualidade: 'Secador',       estoque: 25, vendas: 7.0, fornosDesocupados: 'F12 e F13', reforma: '',              qtdFunc: 6, ocorrencia: '' },
    { queima: 'F6',  enfornas: ['F12 (R e I)', 'F13 (G E JC)', ''],   qualidade: 'Secador',       estoque: 12, vendas: 5.0, fornosDesocupados: 'F14',        reforma: '',              qtdFunc: 4, ocorrencia: '' },
    { queima: 'F7',  enfornas: ['F14 (I e D)', 'F15', ''],            qualidade: 'Pátio Molhado', estoque: 12, vendas: 4.3, fornosDesocupados: 'F15',        reforma: '',              qtdFunc: 0, ocorrencia: '' },
  ],
};

const S4 = {
  id: 's4', numero: 4, dataInicio: '2026-04-20', meta: 10,
  dias: [
    { queima: 'F10', enfornas: ['F15', '', ''],        qualidade: 'Pátio Molhado', estoque: 0,  vendas: 5.0,  fornosDesocupados: '',          reforma: '',              qtdFunc: 0, ocorrencia: 'Muitas faltas, Todos para o continuo para atender a demanda' },
    { queima: 'F11', enfornas: ['', '', ''],            qualidade: 'Pátio Seco',    estoque: 12, vendas: 4.5,  fornosDesocupados: '',          reforma: '',              qtdFunc: 6, ocorrencia: 'FERIADO' },
    { queima: 'F12', enfornas: ['F16', '', ''],         qualidade: 'Pátio Seco',    estoque: 22, vendas: 6.0,  fornosDesocupados: 'F17 e F18', reforma: 'F17 em reforma', qtdFunc: 8, ocorrencia: '' },
    { queima: '',    enfornas: ['F18', '', ''],          qualidade: 'Secador',       estoque: 25, vendas: 9.0,  fornosDesocupados: 'F1 e F2',   reforma: '',              qtdFunc: 6, ocorrencia: 'F17 em reforma atrasou, Iriamos enforna dois hoje, Mas para nao segurar a queima ele foi pulado' },
    { queima: 'F13', enfornas: ['F1', 'F2', ''],        qualidade: 'Pátio Seco',    estoque: 19, vendas: 15.0, fornosDesocupados: 'F3 e F4',   reforma: '',              qtdFunc: 8, ocorrencia: '' },
    { queima: '',    enfornas: ['F3', 'F4', ''],         qualidade: 'Pátio Seco',    estoque: 0,  vendas: 10.0, fornosDesocupados: 'F5',        reforma: '',              qtdFunc: 5, ocorrencia: '' },
  ],
};

const S5 = {
  id: 's5', numero: 5, dataInicio: '2026-04-27', meta: 10,
  dias: [
    { queima: 'F17',    enfornas: ['F4 (R e I)', '', ''],                    qualidade: 'Pátio Seco', estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 6, ocorrencia: '' },
    { queima: 'F18',    enfornas: ['F5 (R e I)', 'F6 (JV e C)', ''],         qualidade: 'Pátio Seco', estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 6, ocorrencia: 'Parte da tarde todos por continuo' },
    { queima: 'F1/F2',  enfornas: ['F7 (R e I)', '', ''],                    qualidade: 'Secador',    estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 0, ocorrencia: '' },
    { queima: 'F3',     enfornas: ['F8 (R e I)', '', ''],                    qualidade: 'Secador',    estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 0, ocorrencia: '' },
    { queima: 'F4',     enfornas: ['F9 (D e L)', 'F10 (R e I)', 'F11 (JV e G)'], qualidade: 'Pátio Seco', estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 0, ocorrencia: '' },
    { queima: '',       enfornas: ['', '', ''],                               qualidade: 'Pátio Seco', estoque: 0, vendas: 0, fornosDesocupados: '', reforma: '', qtdFunc: 0, ocorrencia: '' },
  ],
};

// ─── PONTOS ───────────────────────────────────────────────────────────────────

// Ponto 1 — Semana 27/02 a 04/03/2026
const diasP1 = {
  e01: d(110, 110, 110, 110,  80,  40),
  e02: d( '',  '',  '',  '',  '',  ''),  // não aparece nessa semana
  e03: d(110, 110, 110, 110,  80,  80),
  e04: d( 'F', 'F',  80, 'F', 150, 110),
  e05: d(  85, 110,  50,  50, 130,  50),
  e06: d(  80,  80,  80,  80,  80,  40),
  e07: d( 'F', 'F',  80,  80,  80, 'F'),
  e08: d(  75, 100,  75,  75,  75,  75),
  e09: d( 'F',  75,  75, 'F',  75,  75),
  e10: d( '',  '',  '',  '',  '',  ''),  // não aparece nessa semana
  e11: d( 'F',  80,  80, 'F', 'F',  50),
  e12: d(  75,  75,  75,  75,  75,  35),
  e13: d(  80, 'F',  80,  85,  80,  80),
  e14: d(  40, 140, 110, 110,  80,  80),
  e15: d( 'F', 'F', 'F', 'F', 'F', 'F'),
  e16: d(  75,  35,  75,  75,  75,  75),
  e17: d(  75,  80,  75,  95, 100,  75),
  e18: d( 'F', 100,  75,  95, 100,  75),
  e19: d( 'F',  75,  75,  75,  75,  50),
  e20: d( 'F',  75,  75,  75,  75,  35),
  e21: d( 'F', 'F', 'F',  75,  75,  35),
  e22: d( 'F',  75,  75, 'F',  75,  35),
};

// Ponto 2 — Semana 06/04 a 11/04/2026
const diasP2 = {
  e01: d(100,  55, 110, 'F',  90,  40),
  e02: d('F', 'F', 'F', 'F', 'F', 'F'),
  e03: d(100, 110, 110, 110, 110, 110),
  e04: d('F',  55, 'F', 110,  90,  40),
  e05: d(100, 110, 110, 110, 110, 110),
  e06: d('F',  85,  80,  85,  80,  40),
  e07: d('F',  80,  85,  85,  80,  80),
  e08: d( 75, 'F',  75,  75,  75,  35),
  e09: d( 75,  35,  75,  75, 'F',  35),
  e10: d('F', 'F',  80,  80, 'F', 'F'),
  e11: d( 80,  80,  85,  85,  80,  80),
  e12: d('F',  75,  75,  75,  90,  35),
  e13: d( 80,  80,  80,  85,  75,  35),
  e14: d( 90,  90, 'F',  80,  90,  80),
  e15: d('F',  90,  75,  35,  90,  75),
  e16: d( 35,  90,  75,  75,  90,  75),
  e17: d('F',  80, 'F', 110, 'F',  75),
  e18: d('F',  75, 'F',  75, 'F',  75),
  e19: d('F',  75,  75,  75,  75,  75),
  e20: d('',   '',  '',  '',  '',  ''),
  e21: d('',   '',  '',  '',  '',  ''),
  e22: d('',   '',  '',  '',  '',  ''),
};

// Ponto 3 — Semana 13/04 a 18/04/2026
const diasP3 = {
  e01: d( 40, 110, 'F', 110, 110,  40),
  e02: d('F', 'F', 'F', 'F', 'F', 'F'),
  e03: d(110, 110, 110, 110, 110, 'F'),
  e04: d('F', 'F',   0,   0,   0,  40),
  e05: d(110, 'F', 110, 110, 'F', 'F'),
  e06: d( 85,  80,  85,  80,  80,  40),
  e07: d('F', 'F', 'F',  80,  80,  40),
  e08: d('F',  75,  75,  75,  75,  75),
  e09: d('F',  35,  75,  75,  75,  35),
  e10: d('F',  75, 'F', 'F',  75, 'F'),
  e11: d('F',  80,  80,  80, 110,  40),
  e12: d('F', 'F', 'F', 'F', 'F', 'F'),
  e13: d('F',  80,  80,  80,  80,  40),
  e14: d('F', 'F',  85,  90,  80,  80),
  e15: d( 80,  75,  75,  90, 105,  75),
  e16: d( 80,  75,  75,  90, 105,  75),
  e17: d( 80,  75,  75,  85, 110,  75),
  e18: d( 80,  75,  75,  85,  75,  75),
  e19: d( 80,  75, 'F', 'F',  75,  35),
  e20: d('',   '',  '',  '',  '',  ''),
  e21: d('',   '',  '',  '',  '',  ''),
  e22: d('',   '',  '',  '',  '',  ''),
};

// Ponto 4 — Semana 20/04 a 25/04/2026
const diasP4 = {
  e01: d(110, 'F', 110, 110, 110, 'F'),
  e02: d('F', 'F', 'F', 'F', 'F', 'F'),
  e03: d(110,  80, 110, 110, 110, 135),
  e04: d('F', 'F',  80, 'F', 110, 'F'),
  e05: d( 35,  80,  80, 'F', 110,  80),
  e06: d('F',  80,  80,  80,  80,  80),
  e07: d('F',   0,  80, 110,  80,  80),
  e08: d( '',  75,  75,  35,  75, 'F'),
  e09: d('F', 'F',  75, 105,  90,  75),
  e10: d('F', 'F', 'F',  75,  75, 'F'),
  e11: d('F', 'F', 'F', 'F', 'F', 'F'),
  e12: d('F', 'F', 'F', 'F', 'F', 'F'),
  e13: d('F',  80,  80,  80,  80,  80),
  e14: d( 80,  80,  80, 105, 110,  80),
  e15: d( 40,  75,  85, 105,  35,  80),
  e16: d( 75,  75,  75, 105,  90,  75),
  e17: d( 35,  75,  75,  75,  75, 135),
  e18: d( 35,  75,  75,  75,  75,  75),
  e19: d( 80,  80,  80,  80,  80,  80),
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
