import { useState } from 'react';
import Btn from '../../components/Btn';
import Ic from '../../components/Ic';
import Modal from '../../components/Modal';
import InputRow from '../../components/InputRow';
import styles from './CargaList.module.css';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(iso) {
  const d = fromISO(iso);
  const hoje = toISO(new Date());
  const ontem = toISO(new Date(Date.now() - 86400000));
  if (iso === hoje)  return 'Hoje';
  if (iso === ontem) return 'Ontem';
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

function calcDuracao(inicio, fim) {
  if (!inicio || !fim) return null;
  const [ih, im] = inicio.split(':').map(Number);
  const [fh, fm] = fim.split(':').map(Number);
  let mins = (fh * 60 + fm) - (ih * 60 + im);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

const DESTINOS = [
  { value: 'venda',   label: 'Venda' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'galpao',  label: 'Galpão' },
];

const EMPTY_FORM = { nome: '', qtd: '', tipo: 'externo', destino: '', inicio: '', fim: '', obs: '' };

function CarregamentoForm({ value, onChange }) {
  const duracao = calcDuracao(value.inicio, value.fim);
  const set = (field) => (v) => onChange({ ...value, [field]: v });

  function setTipo(t) {
    onChange({ ...value, tipo: t, destino: t === 'externo' ? '' : value.destino });
  }

  return (
    <div className={styles.form}>
      <InputRow label="Nome / Destino" value={value.nome} onChange={set('nome')} placeholder="Ex: João Silva" />

      <div className={styles.formRow}>
        <InputRow label="Qtd (milheiros)" type="number" value={value.qtd} onChange={set('qtd')} placeholder="0.0" />
        <div className={styles.tipoGroup}>
          <span className={styles.tipoLabel}>Caminhão</span>
          <div className={styles.tipoBtns}>
            <button
              type="button"
              className={`${styles.tipoBtn} ${value.tipo === 'empresa' ? styles.tipoBtnEmpresa : ''}`}
              onClick={() => setTipo('empresa')}
            >
              Empresa
            </button>
            <button
              type="button"
              className={`${styles.tipoBtn} ${value.tipo === 'externo' ? styles.tipoBtnExterno : ''}`}
              onClick={() => setTipo('externo')}
            >
              Externo
            </button>
          </div>
        </div>
      </div>

      {/* Destino — só aparece para caminhão da empresa */}
      {value.tipo === 'empresa' && (
        <div className={styles.destinoGroup}>
          <span className={styles.tipoLabel}>Destino</span>
          <div className={styles.destinoBtns}>
            {DESTINOS.map(d => (
              <button
                key={d.value}
                type="button"
                className={`${styles.destinoBtn} ${value.destino === d.value ? styles.destinoBtnActive : ''}`}
                onClick={() => onChange({ ...value, destino: d.value })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.formRow}>
        <InputRow label="Início" type="time" value={value.inicio} onChange={set('inicio')} />
        <InputRow label="Fim" type="time" value={value.fim} onChange={set('fim')} />
      </div>

      {duracao && (
        <div className={styles.duracaoDisplay}>
          <span className={styles.duracaoLabel}>Duração</span>
          <span className={styles.duracaoVal}>{duracao}</span>
        </div>
      )}

      <InputRow label="Observações" type="textarea" value={value.obs} onChange={set('obs')} placeholder="Opcional..." rows={2} />
    </div>
  );
}

function destinoLabel(item) {
  if (item.tipo === 'externo') return null;
  const d = DESTINOS.find(d => d.value === item.destino);
  return d ? d.label : null;
}

function CarregamentoCard({ item, onEdit }) {
  const duracao = calcDuracao(item.inicio, item.fim);
  const isEmpresa = item.tipo === 'empresa';
  const dest = destinoLabel(item);

  return (
    <button className={styles.card} onClick={onEdit ? () => onEdit(item) : undefined} style={!onEdit ? { cursor: 'default' } : undefined}>
      <div className={styles.cardTop}>
        <span className={styles.cardNome}>{item.nome || '—'}</span>
        <div className={styles.cardPills}>
          <span className={`${styles.tipoPill} ${isEmpresa ? styles.tipoPillEmpresa : styles.tipoPillExterno}`}>
            {isEmpresa ? 'Empresa' : 'Externo'}
          </span>
          {dest && (
            <span className={`${styles.tipoPill} ${styles['tipoPillDest_' + item.destino]}`}>{dest}</span>
          )}
        </div>
      </div>
      <div className={styles.cardMid}>
        {(item.inicio || item.fim) && (
          <span className={styles.cardHora}>
            {item.inicio || '—'} → {item.fim || '—'}
            {duracao && <span className={styles.cardDuracao}> · {duracao}</span>}
          </span>
        )}
        {item.qtd && (
          <span className={styles.cardQtd}>{Number(item.qtd).toFixed(2)} mi</span>
        )}
      </div>
      {item.obs && <p className={styles.cardObs}>{item.obs}</p>}
    </button>
  );
}

export default function CargaList({ store, isViewer }) {
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const lista = store.byDate(selectedDate);
  const totalMi   = lista.reduce((s, c) => s + (Number(c.qtd) || 0), 0);
  const cntEmpresa = lista.filter(c => c.tipo === 'empresa').length;
  const miVenda    = lista
    .filter(c => c.tipo === 'externo' || (c.tipo === 'empresa' && c.destino === 'venda'))
    .reduce((s, c) => s + (Number(c.qtd) || 0), 0);
  const miEstoque  = lista
    .filter(c => c.tipo === 'empresa' && c.destino === 'estoque')
    .reduce((s, c) => s + (Number(c.qtd) || 0), 0);
  const miGalpao   = lista
    .filter(c => c.tipo === 'empresa' && c.destino === 'galpao')
    .reduce((s, c) => s + (Number(c.qtd) || 0), 0);

  function prevDay() {
    const d = fromISO(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toISO(d));
  }
  function nextDay() {
    const d = fromISO(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(toISO(d));
  }
  const isToday = selectedDate === toISO(new Date());

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      nome:    item.nome    || '',
      qtd:     item.qtd     ?? '',
      tipo:    item.tipo    || 'externo',
      destino: item.destino || '',
      inicio:  item.inicio  || '',
      fim:     item.fim     || '',
      obs:     item.obs     || '',
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.nome.trim()) return;
    const payload = {
      data:    selectedDate,
      nome:    form.nome.trim(),
      qtd:     form.qtd !== '' ? Number(form.qtd) : null,
      tipo:    form.tipo,
      destino: form.tipo === 'empresa' ? form.destino : '',
      inicio:  form.inicio,
      fim:     form.fim,
      obs:     form.obs.trim(),
    };
    if (editing) {
      store.update(editing.id, payload);
    } else {
      store.create(payload);
    }
    setModalOpen(false);
  }

  function handleDelete() {
    if (!editing) return;
    store.remove(editing.id);
    setModalOpen(false);
  }

  return (
    <div className={styles.root}>

      {/* Barra de data */}
      <div className={styles.dateBar}>
        <button className={styles.dateArrow} onClick={prevDay}>
          <Ic name="chevron-left" size={18} />
        </button>
        <div className={styles.dateCenter}>
          <span className={styles.dateLabel}>{fmtDate(selectedDate)}</span>
          {!isToday && (
            <button className={styles.dateTodayBtn} onClick={() => setSelectedDate(toISO(new Date()))}>
              hoje
            </button>
          )}
        </div>
        <button className={styles.dateArrow} onClick={nextDay} disabled={isToday}>
          <Ic name="chevron-right" size={18} />
        </button>
      </div>

      {/* Resumo do dia */}
      {lista.length > 0 && (
        <div className={styles.summary}>
          {/* Linha 1 — contagens (igual ao original) */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>{lista.length}</span>
              <span className={styles.summaryLbl}>{lista.length === 1 ? 'carregamento' : 'carregamentos'}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>{totalMi.toFixed(2)}</span>
              <span className={styles.summaryLbl}>milheiros</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>{cntEmpresa}</span>
              <span className={styles.summaryLbl}>empresa</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>{lista.filter(c => c.tipo === 'externo').length}</span>
              <span className={styles.summaryLbl}>externo</span>
            </div>
          </div>

          {/* Linha 2 — milheiros por destino */}
          <div className={styles.summaryRowDest}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal} style={{ color: 'var(--accent)' }}>{miVenda.toFixed(2)}</span>
              <span className={styles.summaryLbl}>venda</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal} style={{ color: 'var(--success)' }}>{miEstoque.toFixed(2)}</span>
              <span className={styles.summaryLbl}>estoque</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal} style={{ color: 'oklch(72% 0.15 260)' }}>{miGalpao.toFixed(2)}</span>
              <span className={styles.summaryLbl}>galpão</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {lista.length === 0 ? (
        <div className={styles.empty}>
          <Ic name="truck" size={40} style={{ opacity: 0.25 }} />
          <p className={styles.emptyTitle}>Nenhum carregamento {isToday ? 'hoje' : 'neste dia'}</p>
          <p className={styles.emptySub}>Toque em + para registrar.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {lista.map(item => (
            <CarregamentoCard key={item.id} item={item} onEdit={isViewer ? undefined : openEdit} />
          ))}
        </div>
      )}

      {/* FAB */}
      {!isViewer && (
        <button className={styles.fab} onClick={openNew} aria-label="Novo carregamento">
          <Ic name="plus" size={24} />
        </button>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Carregamento' : 'Novo Carregamento'}
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            {editing && (
              <Btn variant="danger" onClick={handleDelete}>
                <Ic name="trash" size={14} />
              </Btn>
            )}
            <div style={{ flex: 1 }} />
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={handleSave} disabled={!form.nome.trim()}>Salvar</Btn>
          </div>
        }
      >
        <CarregamentoForm value={form} onChange={setForm} />
      </Modal>
    </div>
  );
}
