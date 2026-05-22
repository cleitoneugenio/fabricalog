import { useState } from 'react';
import Ic from '../../components/Ic';
import Btn from '../../components/Btn';
import Tag from '../../components/Tag';
import Modal from '../../components/Modal';
import InputRow from '../../components/InputRow';
import { weekLabel } from '../../utils/weekLabel';
import { countFornos } from '../../utils/calcSemana';
import styles from './SemanaList.module.css';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function groupByMonth(items) {
  const map = {};
  for (const item of items) {
    const d = new Date(item.dataInicio + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    const label = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
    if (!map[key]) map[key] = { key, label, items: [] };
    map[key].items.push(item);
  }
  return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
}

function SemanaCard({ semana, onSelect }) {
  const dias = semana.dias || [];
  const totalFornos = countFornos(dias);
  const totalVendas = dias.reduce((acc, d) => acc + (Number(d.vendas) || 0), 0);
  const metaOk = totalFornos >= semana.meta;

  return (
    <button className={styles.card} onClick={() => onSelect(semana.id)}>
      <div className={styles.cardTop}>
        <span className={styles.cardTitle}>{weekLabel(semana)}</span>
        <Tag color={metaOk ? 'success' : 'warning'}>
          {totalFornos}/{semana.meta} fornos
        </Tag>
      </div>
      <div className={styles.cardStats}>
        <span>Vendas: <strong>{totalVendas.toFixed(1)} mi</strong></span>
        <span>Fornos: <strong>{totalFornos}</strong></span>
      </div>
    </button>
  );
}

export default function SemanaList({ semanas, onCreate, onSelect, isViewer }) {
  const [open, setOpen] = useState(false);
  const [numero, setNumero] = useState('');
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [collapsed, setCollapsed] = useState(new Set());

  const sorted = [...semanas].sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
  const groups = groupByMonth(sorted);

  function toggleGroup(key) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleCreate() {
    if (numero === '' || numero === undefined || !dataInicio) return;
    onCreate({ numero: Number(numero), dataInicio, meta: 10 });
    setOpen(false);
    setNumero('');
    setDataInicio(new Date().toISOString().split('T')[0]);
  }

  return (
    <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Produção</h1>
          <p className={styles.sub}>Controle semanal de produção</p>
        </div>
        {!isViewer && (
          <Btn variant="primary" size="sm" onClick={() => setOpen(true)}>
            <Ic name="plus" size={14} /> Nova Semana
          </Btn>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <Ic name="production" size={40} style={{ opacity: 0.35 }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Nenhuma semana cadastrada</p>
            <p style={{ fontSize: 12 }}>Registre a primeira semana de produção.</p>
          </div>
          {!isViewer && (
            <Btn variant="primary" onClick={() => setOpen(true)}>
              <Ic name="plus" size={16} /> Criar primeira semana
            </Btn>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {groups.map((group, i) => {
            const isOpen = !collapsed.has(group.key);
            return (
              <div key={group.key} className={styles.monthGroup}>
                <button className={styles.monthHeader} onClick={() => toggleGroup(group.key)}>
                  <span>{group.label}</span>
                  <Ic name="chevron-right" size={14} className={`${styles.monthChevron} ${isOpen ? styles.open : ''}`} />
                </button>
                {isOpen && (
                  <div className={styles.monthItems}>
                    {group.items.map(s => (
                      <SemanaCard key={s.id} semana={s} onSelect={onSelect} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova Semana de Produção"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={handleCreate} disabled={!numero || !dataInicio}>
              Criar Semana
            </Btn>
          </>
        }
      >
        <InputRow label="Número da Semana" type="number" value={numero} onChange={setNumero} placeholder="ex: 12" />
        <InputRow label="Data de Início" type="date" value={dataInicio} onChange={setDataInicio} />
      </Modal>
    </div>
  );
}
