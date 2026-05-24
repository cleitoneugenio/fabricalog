import { useState, useRef } from 'react';
import Ic from '../../components/Ic';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import InputRow from '../../components/InputRow';
import styles from './EquipeList.module.css';

export default function EquipeList({ employees, onAdd, onRename, onRemove, onReactivate, isViewer }) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const cancellingEdit = useRef(false);

  const active   = employees.filter(e => e.ativo !== false);
  const inactive = employees.filter(e => e.ativo === false);

  function handleAdd() {
    if (!name.trim()) return;
    onAdd(name);
    setName('');
    setAddOpen(false);
  }

  function startEdit(emp) {
    setEditId(emp.id);
    setEditName(emp.name);
  }

  function commitEdit() {
    if (cancellingEdit.current) { cancellingEdit.current = false; return; }
    if (editName.trim()) onRename(editId, editName);
    setEditId(null);
  }

  function handleRemove() {
    onRemove(confirmId);
    setConfirmId(null);
  }

  const confirmTarget = employees.find(e => e.id === confirmId);

  return (
    <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Equipe</h1>
          <p className={styles.sub}>{active.length} ativo{active.length !== 1 ? 's' : ''}{inactive.length > 0 ? ` · ${inactive.length} inativo${inactive.length !== 1 ? 's' : ''}` : ''}</p>
        </div>
        {!isViewer && (
          <Btn variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Ic name="person-plus" size={14} /> Adicionar
          </Btn>
        )}
      </div>

      {employees.length === 0 ? (
        <div className={styles.empty}>
          <Ic name="users" size={40} style={{ opacity: 0.35 }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Nenhum funcionário</p>
            <p style={{ fontSize: 12 }}>Adicione o primeiro funcionário da equipe.</p>
          </div>
          {!isViewer && (
            <Btn variant="primary" onClick={() => setAddOpen(true)}>
              <Ic name="person-plus" size={16} /> Adicionar funcionário
            </Btn>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {active.map((emp, i) => (
            <div key={emp.id} className={styles.card}>
              <span className={styles.num}>{i + 1}</span>
              {!isViewer && editId === emp.id ? (
                <input
                  className={styles.editInput}
                  value={editName}
                  autoFocus
                  onChange={e => setEditName(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') { cancellingEdit.current = true; setEditId(null); }
                  }}
                />
              ) : (
                <span
                  className={styles.empName}
                  onClick={!isViewer ? () => startEdit(emp) : undefined}
                  title={!isViewer ? 'Clique para renomear' : undefined}
                  style={isViewer ? { cursor: 'default' } : undefined}
                >
                  {emp.name}
                </span>
              )}
              {!isViewer && (
                <button
                  className={styles.deleteBtn}
                  onClick={() => setConfirmId(emp.id)}
                  title="Desativar funcionário"
                >
                  <Ic name="trash" size={14} />
                </button>
              )}
            </div>
          ))}

          {inactive.length > 0 && (
            <>
              <div style={{ padding: '16px 4px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-subtle)' }}>
                Inativos
              </div>
              {inactive.map(emp => (
                <div key={emp.id} className={styles.card} style={{ opacity: 0.45 }}>
                  <span className={styles.num}>—</span>
                  <span className={styles.empName} style={{ cursor: 'default', textDecoration: 'line-through' }}>
                    {emp.name}
                  </span>
                  {!isViewer && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => onReactivate(emp.id)}
                      title="Reativar funcionário"
                      style={{ color: 'var(--success)' }}
                    >
                      <Ic name="check" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setName(''); }}
        title="Adicionar Funcionário"
        footer={
          <>
            <Btn variant="ghost" onClick={() => { setAddOpen(false); setName(''); }}>Cancelar</Btn>
            <Btn variant="primary" onClick={handleAdd} disabled={!name.trim()}>
              Adicionar
            </Btn>
          </>
        }
      >
        <InputRow
          label="Nome completo"
          value={name}
          onChange={setName}
          placeholder="ex: João Silva"
        />
      </Modal>

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Desativar funcionário"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirmId(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={handleRemove}>Desativar</Btn>
          </>
        }
      >
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          <strong style={{ color: 'var(--text)' }}>{confirmTarget?.name}</strong>{' '}
          não aparecerá em novas semanas de ponto. O histórico existente é preservado e pode ser reativado a qualquer momento.
        </p>
      </Modal>
    </div>
  );
}
