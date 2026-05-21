import { useState, useEffect } from 'react';
import Ic from '../../components/Ic';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import DiaForm from './DiaForm';
import { exportSemana } from './semanaExport';
import { weekLabel, DAY_NAMES, isWeekPast } from '../../utils/weekLabel';
import { countFornos } from '../../utils/calcSemana';
import styles from './SemanaDetalhe.module.css';

// Retorna a data ISO do dia da semana (0=seg … 5=sáb)
function dayISO(dataInicio, idx) {
  const d = new Date(dataInicio + 'T12:00:00');
  d.setDate(d.getDate() + idx);
  return d.toISOString().slice(0, 10);
}

// Soma carregamentos de uma data por destino
function totaisCarregamentos(carregamentos, iso) {
  const lista = (carregamentos || []).filter(c => c.data === iso);
  const vendas = lista
    .filter(c => c.tipo === 'externo' || (c.tipo === 'empresa' && c.destino === 'venda'))
    .reduce((s, c) => s + (Number(c.qtd) || 0), 0);
  const estoque = lista
    .filter(c => c.tipo === 'empresa' && c.destino === 'estoque')
    .reduce((s, c) => s + (Number(c.qtd) || 0), 0);
  const emCaminhoes = lista
    .filter(c => c.tipo === 'empresa' && c.destino === 'galpao')
    .reduce((s, c) => s + (Number(c.qtd) || 0), 0);
  return { vendas, estoque, emCaminhoes };
}

export default function SemanaDetalhe({ semana, carregamentos, onBack, onUpdateDia, onUpdate, onDelete }) {
  const [activeDay, setActiveDay] = useState(0);

  // Auto-preenche vendas/estoque/galpão a partir dos carregamentos do dia,
  // mas só se os três campos estiverem todos vazios (não sobrescreve dados existentes)
  useEffect(() => {
    if (!carregamentos?.length || !semana.dataInicio) return;
    const dia = (semana.dias || [])[activeDay] || {};
    const isEmpty = !Number(dia.vendas) && !Number(dia.estoque) && !Number(dia.emCaminhoes);
    if (!isEmpty) return;
    const iso = dayISO(semana.dataInicio, activeDay);
    const { vendas, estoque, emCaminhoes } = totaisCarregamentos(carregamentos, iso);
    if (vendas > 0 || estoque > 0 || emCaminhoes > 0) {
      onUpdateDia(activeDay, {
        ...dia,
        vendas:      vendas      > 0 ? String(vendas)      : (dia.vendas      ?? ''),
        estoque:     estoque     > 0 ? String(estoque)     : (dia.estoque     ?? ''),
        emCaminhoes: emCaminhoes > 0 ? String(emCaminhoes) : (dia.emCaminhoes ?? ''),
      });
    }
  }, [activeDay, semana.dataInicio]);
  const [showDelete, setShowDelete] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(String(semana.meta));
  const [showEdit, setShowEdit] = useState(false);
  const [editNumero, setEditNumero] = useState(String(semana.numero));
  const [editData, setEditData] = useState(semana.dataInicio);

  const dias = semana.dias || [];
  const totalFornos    = countFornos(dias);
  const totalVendas    = dias.reduce((acc, d) => acc + (Number(d.vendas)  || 0), 0);
  const totalEstoque   = dias.reduce((acc, d) => acc + (Number(d.estoque) || 0), 0);
  const totalMilheiros = totalVendas + totalEstoque;
  const metaOk = totalFornos >= semana.meta;
  const past   = isWeekPast(semana);

  return (
    <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.back} onClick={onBack}>
          <Ic name="arrow-left" size={18} />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{weekLabel(semana)}</h1>
          <span className={styles.meta}>
            Meta: {totalFornos} / {semana.meta} fornos
            <span
              className={styles.metaStatus}
              style={{ color: metaOk ? 'var(--success)' : 'var(--warning)' }}
            >
              {metaOk ? ' ✓ Atingida' : ` — ${past ? 'faltou' : 'faltam'} ${semana.meta - totalFornos}`}
            </span>
          </span>
        </div>
        <div className={styles.actions}>
          <Btn variant="ghost" size="sm" onClick={() => exportSemana(semana).catch(err => alert(`Erro ao exportar: ${err.message}`))}>
            <Ic name="download" size={14} /> Exportar
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => { setEditNumero(String(semana.numero)); setEditData(semana.dataInicio); setShowEdit(true); }}>
            <Ic name="edit" size={14} />
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => { setMetaInput(String(semana.meta)); setShowMeta(true); }}>
            Meta
          </Btn>
          <Btn variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            <Ic name="trash" size={14} />
          </Btn>
        </div>
      </div>

      {/* Meta progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${Math.min(100, (totalFornos / Math.max(1, semana.meta)) * 100)}%`,
            background: metaOk ? 'var(--success)' : 'var(--accent)',
          }}
        />
      </div>

      {/* Totals row */}
      <div className={styles.totals}>
        <div className={styles.total}>
          <span className={styles.totalLabel}>Total Milheiros</span>
          <span className={styles.totalVal}>{totalMilheiros.toFixed(1)} mi</span>
          <span className={styles.totalSub}>V: {totalVendas.toFixed(1)} · E: {totalEstoque.toFixed(1)}</span>
        </div>
        <div className={styles.total}>
          <span className={styles.totalLabel}>Fornos enformados</span>
          <span className={styles.totalVal}>{totalFornos}</span>
        </div>
      </div>

      {/* Day pills */}
      <div className={styles.pills}>
        {DAY_NAMES.map((name, i) => {
          const d = dias[i] || {};
          const enfornas = d.enfornas ?? (d.enforna ? [d.enforna] : []);
          const hasData = d.queima || enfornas.some(e => e && e.trim()) || Number(d.vendas) || Number(d.estoque);
          return (
            <button
              key={i}
              className={`${styles.pill} ${activeDay === i ? styles.pillActive : ''} ${hasData ? styles.pillFilled : ''}`}
              onClick={() => setActiveDay(i)}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Day form */}
      <div className={styles.formWrap}>
        <DiaForm
          dia={dias[activeDay] || {}}
          onChange={(updated) => onUpdateDia(activeDay, updated)}
        />
      </div>

      {/* Delete modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Excluir semana"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowDelete(false)}>Cancelar</Btn>
            <Btn variant="danger" onClick={onDelete}>Excluir</Btn>
          </>
        }
      >
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          Tem certeza que deseja excluir <strong style={{ color: 'var(--text)' }}>{weekLabel(semana)}</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>

      {/* Edit numero/data modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar semana"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={() => {
              onUpdate({ numero: Number(editNumero) || semana.numero, dataInicio: editData });
              setShowEdit(false);
            }}>Salvar</Btn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Número da semana</label>
            <input type="number" value={editNumero} onChange={e => setEditNumero(e.target.value)}
              style={{ background: 'oklch(15% 0.016 38)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '9px 12px', fontSize: 14, fontFamily: 'var(--font)', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data de início</label>
            <input type="date" value={editData} onChange={e => setEditData(e.target.value)}
              style={{ background: 'oklch(15% 0.016 38)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '9px 12px', fontSize: 14, fontFamily: 'var(--font)', width: '100%' }} />
          </div>
        </div>
      </Modal>

      {/* Edit meta modal */}
      <Modal
        open={showMeta}
        onClose={() => setShowMeta(false)}
        title="Alterar meta de fornos"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowMeta(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={() => { onUpdate({ meta: Number(metaInput) || 10 }); setShowMeta(false); }}>Salvar</Btn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Meta de fornos por semana
          </label>
          <input
            type="number"
            value={metaInput}
            onChange={e => setMetaInput(e.target.value)}
            style={{
              background: 'oklch(15% 0.016 38)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text)', padding: '9px 12px',
              fontSize: 14, fontFamily: 'var(--font)', width: '100%',
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
