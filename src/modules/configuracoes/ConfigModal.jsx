import { useState } from 'react';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import InputRow from '../../components/InputRow';

export default function ConfigModal({ open, onClose, settings, onSave }) {
  const [form, setForm] = useState(settings);

  function handleOpen() {
    setForm(settings);
  }

  function set(field) {
    return (value) => setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onSave(form);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      onOpen={handleOpen}
      title="Configurações da Empresa"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={handleSave}>Salvar</Btn>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
          Dados usados nos recibos de prestação de serviço.
        </p>
        <InputRow
          label="Razão Social"
          value={form.empresa}
          onChange={set('empresa')}
          placeholder="Nome da empresa"
        />
        <InputRow
          label="CNPJ"
          value={form.cnpj}
          onChange={set('cnpj')}
          placeholder="00.000.000/0000-00"
        />
        <InputRow
          label="Endereço"
          value={form.endereco}
          onChange={set('endereco')}
          placeholder="Endereço completo"
        />
        <InputRow
          label="Cidade"
          value={form.cidade}
          onChange={set('cidade')}
          placeholder="Cidade - UF"
        />

        {/* Sobre */}
        <div style={{
          marginTop: 8,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>FabricaLog</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>Forno CEDAN</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--accent)',
            background: 'var(--accent-dim)',
            padding: '3px 9px',
            borderRadius: 99,
            letterSpacing: '0.04em',
          }}>
            v{__APP_VERSION__}
          </span>
        </div>
      </div>
    </Modal>
  );
}
