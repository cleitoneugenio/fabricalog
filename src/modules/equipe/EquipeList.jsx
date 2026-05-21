import { useState, useRef } from 'react';
import Ic from '../../components/Ic';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import InputRow from '../../components/InputRow';
import styles from './EquipeList.module.css';

export default function EquipeList({ employees, onAdd, onRename, onRemove }) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const cancellingEdit = useRef(false);

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
          <p className={styles.sub}>{employees.length} funcionário{employees.length !== 1 ? 's' : ''} cadastrado{employees.length !== 1 ? 's' : ''}</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <Ic name="person-plus" size={14} /> Adicionar
        </Btn>
      </div>

      {employees.length === 0 ? (
        <div className={styles.empty}>
          <Ic name="users" size={40} style={{ opacity: 0.35 }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Nenhum funcionário</p>
            <p style={{ fontSize: 12 }}>Adicione o primeiro funcionário da equipe.</p>
          </div>
          <Btn variant="primary" onClick={() => setAddOpen(true)}>
            <Ic name="person-plus" size={16} /> Adicionar funcionário
          </Btn>
        </div>
      ) : (
        <div className={styles.list}>
          {employees.map((emp, i) => (
            <div key={emp.id} className={styles.card}>
              <span className={styles.num}>{i + 1}</span>
              {editId === emp.id ? (
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
                  onClick={() => startEdit(emp)}
                  title="Clique para renomear"
                >
                  {emp.name}
                </span>
              )}
              <button
                className={styles.deleteBtn}
                onClick={() => setConfirmId(emp.id)}
                title="Remover funcionário"
              >
                <Ic name="trash" size={14} />
              </button>
            </div>
          ))}
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
        title="Remover funcionário"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirmId(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={handleRemove}>Remover</Btn>
          </>
        }
      >
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          Tem certeza que deseja remover{' '}
          <strong style={{ color: 'var(--text)' }}>{confirmTarget?.name}</strong>?
          {' '}Os registros de ponto existentes não serão afetados.
        </p>
      </Modal>
    </div>
  );
}
