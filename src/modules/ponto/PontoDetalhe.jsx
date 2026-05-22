import { useState } from 'react';
import Ic from '../../components/Ic';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import PontoCellEditor from './PontoCellEditor';
import { exportPonto } from './pontoExport';
import { gerarRecibos } from '../../utils/gerarRecibos';
import { calcPonto } from '../../utils/calcPonto';
import { weekLabel, DAY_NAMES } from '../../utils/weekLabel';
import { formatBRL } from '../../utils/formatBRL';
import styles from './PontoDetalhe.module.css';

const DAY_KEYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const QUICK_VALUES = [35, 40, 75, 80, 110];

// ── Mobile bottom sheet editor ───────────────────────────────────────────────
function MobileEditor({ employee, dayKey, dayLabel, value, nota, onSave, onClose }) {
  const [input, setInput] = useState(value === 'F' ? '' : String(value ?? ''));
  const [noteInput, setNoteInput] = useState(nota ?? '');
  const [showNote, setShowNote] = useState(!!(nota && nota.trim()));

  function commit(val) {
    onSave(val, noteInput.trim()); // pai decide fechar ou avançar
  }

  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <span className={styles.sheetEmp}>{employee.name}</span>
          <span className={styles.sheetDay}>{dayLabel}</span>
        </div>

        <div className={styles.quickRow}>
          {QUICK_VALUES.map(v => (
            <button
              key={v}
              className={`${styles.quickBtn} ${String(input) === String(v) ? styles.quickBtnActive : ''}`}
              onPointerDown={e => { e.preventDefault(); commit(String(v)); }}
            >
              {v}
            </button>
          ))}
          <button
            className={`${styles.quickBtn} ${styles.quickBtnFalta} ${value === 'F' ? styles.quickBtnFaltaActive : ''}`}
            onPointerDown={e => { e.preventDefault(); commit('F'); }}
          >
            F
          </button>
        </div>

        <div className={styles.sheetInputRow}>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            className={styles.sheetInput}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Outro valor..."
          />
        </div>

        <button
          className={`${styles.sheetNoteToggle} ${showNote ? styles.sheetNoteActive : ''}`}
          onClick={() => setShowNote(s => !s)}
        >
          <Ic name="edit" size={14} /> {showNote ? 'Ocultar nota' : 'Adicionar nota'}
        </button>

        {showNote && (
          <textarea
            autoFocus={false}
            className={styles.sheetNoteInput}
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            placeholder="Observação..."
            rows={2}
          />
        )}

        <div className={styles.sheetActions}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={() => commit(input.trim() === '' ? '' : input.trim())}>
            Salvar
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Mobile employee card ──────────────────────────────────────────────────────
function EmployeeCard({ employee, dias, onEdit, onToggleBonus }) {
  const { dias: dCount, bonus, bonusEligible, total } = calcPonto(dias);
  const hasActivity = dCount > 0;
  const bloqueado = !!dias.bonus_bloqueado;

  return (
    <div className={`${styles.empCard} ${!hasActivity ? styles.empCardInactive : ''}`}>
      <div className={styles.empCardHeader}>
        <span className={styles.empName}>{employee.name}</span>
        <span className={styles.empTotal} style={{ color: hasActivity ? 'var(--success)' : 'var(--text-subtle)' }}>
          {hasActivity ? formatBRL(total) : '—'}
        </span>
      </div>

      <div className={styles.empDays}>
        {DAY_KEYS.map((key, i) => {
          const val = dias[key];
          const isFalta = val === 'F';
          const hasVal = val !== '' && val != null;
          const hasNota = !!(dias[key + '_nota'] && dias[key + '_nota'].trim());
          return (
            <button
              key={key}
              className={`${styles.dayPill} ${isFalta ? styles.dayPillFalta : hasVal ? styles.dayPillFilled : styles.dayPillEmpty}`}
              onClick={onEdit ? () => onEdit(employee, key, DAY_SHORT[i], val, dias[key + '_nota']) : undefined}
              style={!onEdit ? { cursor: 'default' } : undefined}
            >
              <span className={styles.dayPillLabel}>{DAY_SHORT[i]}</span>
              <span className={styles.dayPillVal}>
                {isFalta ? 'F' : hasVal ? val : '—'}
              </span>
              {hasNota && <span className={styles.dayPillNota} />}
            </button>
          );
        })}
      </div>

      {hasActivity && (
        <div className={styles.empFooter}>
          <span>{dCount} dia{dCount !== 1 ? 's' : ''}</span>
          {bonusEligible && onToggleBonus && (
            <button
              className={`${styles.bonusToggle} ${bloqueado ? styles.bonusToggleOff : styles.bonusToggleOn}`}
              onClick={() => onToggleBonus(employee.id, !bloqueado)}
            >
              {bloqueado ? '✕ Bônus bloqueado' : `✓ Bônus ${formatBRL(25)}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Desktop table ─────────────────────────────────────────────────────────────
function DesktopTable({ ponto, employees, totals, editing, setEditing, onUpdateCell }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thNum}>#</th>
            <th className={styles.thName}>Funcionário</th>
            {DAY_NAMES.map(d => <th key={d} className={styles.thDay}>{d}</th>)}
            <th className={styles.thCalc}>Dias</th>
            <th className={styles.thCalc}>Bônus</th>
            <th className={styles.thTotal}>Total</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => {
            const d = ponto.dias[emp.id] ?? {};
            const { dias, bonus, bonusEligible, total } = calcPonto(d);
            const bloqueado = !!d.bonus_bloqueado;
            return (
              <tr key={emp.id} className={styles.row}>
                <td className={styles.tdNum}>{i + 1}</td>
                <td className={styles.tdName}>{emp.name}</td>
                {DAY_KEYS.map(key => {
                  const val = d[key];
                  const nota = d[key + '_nota'];
                  const isFalta = val === 'F';
                  const hasNota = !!(nota && nota.trim());
                  const isEditing = editing?.empId === emp.id && editing?.dayKey === key;
                  return (
                    <td
                      key={key}
                      className={`${styles.tdDay} ${isFalta ? styles.tdFalta : ''}`}
                      data-cell
                      style={{ position: 'relative' }}
                      onClick={() => setEditing({ empId: emp.id, dayKey: key })}
                    >
                      {isEditing ? (
                        <PontoCellEditor
                          value={val}
                          nota={nota}
                          onSave={(v, n) => onUpdateCell(emp.id, key, v, n)}
                          onClose={() => setEditing(null)}
                        />
                      ) : (
                        <span className={isFalta ? styles.falta : styles.wage}>
                          {val === '' || val == null ? '—' : val}
                          {hasNota && <span className={styles.notaDot} title={nota}>●</span>}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className={styles.tdCalc}>{dias}</td>
                <td
                  className={`${styles.tdCalc} ${bonusEligible ? styles.tdBonusClickable : ''}`}
                  title={bonusEligible ? (bloqueado ? 'Clique para liberar bônus' : 'Clique para bloquear bônus') : ''}
                  onClick={bonusEligible ? () => onUpdateCell(emp.id, 'bonus_bloqueado', !bloqueado, undefined) : undefined}
                >
                  {bonusEligible ? (
                    <span className={bloqueado ? styles.bonusCellOff : styles.bonusCellOn}>
                      {bloqueado ? '✕' : '✓'} {formatBRL(25)}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)' }}>—</span>
                  )}
                </td>
                <td className={styles.tdTotal}>{formatBRL(total)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={styles.footerRow}>
            <td colSpan={2} className={styles.footerLabel}>TOTAL GERAL</td>
            {totals.days.map((v, i) => (
              <td key={i} className={styles.footerCell}>{v > 0 ? v : '—'}</td>
            ))}
            <td className={styles.footerCell}>{totals.dias}</td>
            <td className={styles.footerCell}>{formatBRL(totals.bonus)}</td>
            <td className={styles.footerTotal}>{formatBRL(totals.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Recibos picker ────────────────────────────────────────────────────────────
function RecibosPicker({ ponto, employees, settings, onClose }) {
  const rows = employees.map(emp => {
    const d = ponto.dias[emp.id] ?? {};
    const { total } = calcPonto(d);
    return { emp, total };
  });

  const [selected, setSelected] = useState(() => new Set(
    rows.filter(r => r.total > 0).map(r => r.emp.id)
  ));
  const [loading, setLoading] = useState(false);

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const withValue = rows.filter(r => r.total > 0).map(r => r.emp.id);
    const allChecked = withValue.every(id => selected.has(id));
    setSelected(new Set(allChecked ? [] : withValue));
  }

  async function handleGerar() {
    const filtered = employees.filter(e => selected.has(e.id));
    if (filtered.length === 0) return;
    setLoading(true);
    try {
      await gerarRecibos(ponto, filtered, settings);
    } catch (err) {
      alert(`Erro ao gerar recibos: ${err.message}`);
    } finally {
      setLoading(false);
      onClose();
    }
  }

  const withValue = rows.filter(r => r.total > 0);
  const withoutValue = rows.filter(r => r.total === 0);
  const totalSelecionado = rows
    .filter(r => selected.has(r.emp.id))
    .reduce((s, r) => s + r.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header de seleção */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {selected.size} selecionado{selected.size !== 1 ? 's' : ''} · {formatBRL(totalSelecionado)}
        </span>
        <button
          onClick={toggleAll}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font)' }}
        >
          {withValue.every(r => selected.has(r.emp.id)) ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>

      {/* Lista com valor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
        {withValue.map(({ emp, total }) => (
          <label
            key={emp.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 8, cursor: 'pointer',
              background: selected.has(emp.id) ? 'var(--accent-dim)' : 'oklch(14% 0.016 38)',
              border: `1px solid ${selected.has(emp.id) ? 'var(--accent)' : 'var(--border)'}`,
              transition: 'all 0.12s',
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(emp.id)}
              onChange={() => toggle(emp.id)}
              style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{emp.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-mono, monospace)' }}>
              {formatBRL(total)}
            </span>
          </label>
        ))}

        {/* Funcionários sem valor — sempre desmarcados */}
        {withoutValue.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 4px 4px' }}>
              Sem valor esta semana
            </div>
            {withoutValue.map(({ emp }) => (
              <div
                key={emp.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, opacity: 0.45,
                  background: 'oklch(14% 0.016 38)', border: '1px solid var(--border)',
                }}
              >
                <input type="checkbox" disabled checked={false}
                  style={{ width: 15, height: 15, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-dim)' }}>{emp.name}</span>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>—</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={handleGerar} disabled={loading || selected.size === 0}>
          <Ic name="file-text" size={14} />
          {loading ? 'Gerando...' : `Gerar ${selected.size} recibo${selected.size !== 1 ? 's' : ''}`}
        </Btn>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PontoDetalhe({ ponto, employees, settings, isViewer, onBack, onUpdateCell, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [mobileEdit, setMobileEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRecibosPicker, setShowRecibosPicker] = useState(false);
  const [editNumero, setEditNumero] = useState(String(ponto.numero));
  const [editData, setEditData] = useState(ponto.dataInicio);

  const totals = employees.reduce(
    (acc, emp) => {
      const d = ponto.dias[emp.id] ?? {};
      const { dias, bonus, total } = calcPonto(d);
      acc.dias += dias;
      acc.bonus += bonus;
      acc.total += total;
      DAY_KEYS.forEach((k, ki) => {
        const v = d[k];
        if (v !== 'F' && v !== '' && v != null) acc.days[ki] += Number(v) || 0;
        if (v !== 'F' && v !== '' && v != null) acc.presence[ki]++;
      });
      return acc;
    },
    { dias: 0, bonus: 0, total: 0, days: [0, 0, 0, 0, 0, 0], presence: [0, 0, 0, 0, 0, 0] }
  );

  const totalEmp = employees.length || 1;

  return (
    <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.back} onClick={onBack}>
          <Ic name="arrow-left" size={18} />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{weekLabel(ponto)}</h1>
          <span className={styles.sub}>Controle de Ponto — Forno CEDAN</span>
        </div>
        <div className={styles.actions}>
          <Btn variant="ghost" size="sm" onClick={() => exportPonto(ponto, employees).catch(err => alert(`Erro ao exportar: ${err.message}`))}>
            <Ic name="download" size={14} /> <span className={styles.btnLabel}>Exportar</span>
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => setShowRecibosPicker(true)}>
            <Ic name="file-text" size={14} /> <span className={styles.btnLabel}>Recibos</span>
          </Btn>
          {!isViewer && (
            <>
              <Btn variant="ghost" size="sm" onClick={() => { setEditNumero(String(ponto.numero)); setEditData(ponto.dataInicio); setShowEdit(true); }}>
                <Ic name="edit" size={14} />
              </Btn>
              <Btn variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                <Ic name="trash" size={14} />
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* Total card */}
      <div className={styles.totalCard}>
        <span className={styles.totalLabel}>Total Geral da Semana</span>
        <span className={styles.totalVal}>{formatBRL(totals.total)}</span>
      </div>

      {/* Attendance card */}
      <div className={styles.attendanceCard}>
        <span className={styles.attendanceTitle}>Presença por Dia</span>
        <div className={styles.attendanceDays}>
          {DAY_SHORT.map((day, i) => {
            const count = totals.presence[i];
            const pct = Math.round((count / totalEmp) * 100);
            return (
              <div key={day} className={styles.attendanceDay}>
                <span className={styles.attendanceDayLabel}>{day}</span>
                <div className={styles.attendanceBarWrap}>
                  <div
                    className={styles.attendanceBarFill}
                    style={{
                      height: `${pct}%`,
                      background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                    }}
                  />
                </div>
                <span className={styles.attendancePct}>{count > 0 ? `${pct}%` : '—'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: card list */}
      <div className={styles.mobileList}>
        {employees.map(emp => (
          <EmployeeCard
            key={emp.id}
            employee={emp}
            dias={ponto.dias[emp.id] ?? {}}
            onEdit={isViewer ? undefined : (employee, key, label, val, nota) =>
              setMobileEdit({ employee, key, label, val, nota })
            }
            onToggleBonus={isViewer ? undefined : (empId, block) => onUpdateCell(empId, 'bonus_bloqueado', block, undefined)}
          />
        ))}
        <p className={styles.legend}>
          <strong>F</strong> = Falta &nbsp;|&nbsp; <strong>Bônus R$25</strong> = 6 dias trabalhados (toque para bloquear individualmente)
        </p>
      </div>

      {/* Desktop: table */}
      <div className={styles.desktopTable}>
        <DesktopTable
          ponto={ponto}
          employees={employees}
          totals={totals}
          editing={isViewer ? null : editing}
          setEditing={isViewer ? () => {} : setEditing}
          onUpdateCell={isViewer ? () => {} : onUpdateCell}
        />
        <p className={styles.legend}>
          <strong>F</strong> = Falta &nbsp;|&nbsp; <strong>R$ 25</strong> = Bônus automático (6 dias) · clique para bloquear individualmente &nbsp;|&nbsp; <strong>●</strong> = Nota
        </p>
      </div>

      {/* Mobile bottom sheet editor */}
      {mobileEdit && (
        <MobileEditor
          key={mobileEdit.employee.id + '_' + mobileEdit.key}
          employee={mobileEdit.employee}
          dayKey={mobileEdit.key}
          dayLabel={mobileEdit.label}
          value={mobileEdit.val}
          nota={mobileEdit.nota}
          onSave={(v, n) => {
            onUpdateCell(mobileEdit.employee.id, mobileEdit.key, v, n);
            const idx = employees.findIndex(e => e.id === mobileEdit.employee.id);
            const next = employees[idx + 1];
            if (next) {
              const d = ponto.dias[next.id] ?? {};
              const dayIdx = DAY_KEYS.indexOf(mobileEdit.key);
              setMobileEdit({ employee: next, key: mobileEdit.key, label: DAY_SHORT[dayIdx], val: d[mobileEdit.key], nota: d[mobileEdit.key + '_nota'] });
            } else {
              setMobileEdit(null);
            }
          }}
          onClose={() => setMobileEdit(null)}
        />
      )}

      {/* Edit numero/data modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar semana de ponto"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={() => {
              onUpdate({ numero: Number(editNumero) || ponto.numero, dataInicio: editData });
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

      {/* Delete modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Excluir semana de ponto"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowDelete(false)}>Cancelar</Btn>
            <Btn variant="danger" onClick={onDelete}>Excluir</Btn>
          </>
        }
      >
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          Tem certeza que deseja excluir o ponto de <strong style={{ color: 'var(--text)' }}>{weekLabel(ponto)}</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>

      {/* Recibos picker modal */}
      <Modal
        open={showRecibosPicker}
        onClose={() => setShowRecibosPicker(false)}
        title="Gerar Recibos"
      >
        <RecibosPicker
          ponto={ponto}
          employees={employees}
          settings={settings}
          onClose={() => setShowRecibosPicker(false)}
        />
      </Modal>
    </div>
  );
}
