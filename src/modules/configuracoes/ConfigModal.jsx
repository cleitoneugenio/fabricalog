import { useState, useEffect } from 'react';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import InputRow from '../../components/InputRow';
import { supabase } from '../../lib/supabase';

const ALL_SCOPES = [
  { key: 'dash',   label: 'Dashboard' },
  { key: 'semana', label: 'Produção' },
  { key: 'carga',  label: 'Carregamentos' },
  { key: 'ponto',  label: 'Ponto' },
  { key: 'equipe', label: 'Equipe' },
  { key: 'forno',  label: 'Forno' },
  { key: 'camara', label: 'Calculadora' },
];

const DEFAULT_SCOPES = ALL_SCOPES.map(s => s.key);

function ScopeCheckboxes({ value, onChange }) {
  function toggle(key) {
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', marginTop: 4 }}>
      {ALL_SCOPES.map(s => {
        const checked = value.includes(s.key);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => toggle(s.key)}
            style={{
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)',
              padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
              border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
              background: checked ? 'var(--accent-dim)' : 'transparent',
              color: checked ? 'var(--accent)' : 'var(--text-dim)',
              transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function ViewerRow({ viewer, onRemove, onUpdateScopes }) {
  const [open, setOpen] = useState(false);
  const [scopes, setScopes] = useState(viewer.scopes ?? DEFAULT_SCOPES);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from('viewer_access').update({ scopes }).eq('id', viewer.id);
    onUpdateScopes(viewer.id, scopes);
    setSaving(false);
    setOpen(false);
  }

  const scopeLabels = (viewer.scopes ?? DEFAULT_SCOPES)
    .map(k => ALL_SCOPES.find(s => s.key === k)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <div style={{
      background: 'oklch(14% 0.016 38)', border: '1px solid var(--border)',
      borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {viewer.viewer_email}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {scopeLabels || 'Sem acesso'}
          </div>
        </div>
        <button
          onClick={() => { setScopes(viewer.scopes ?? DEFAULT_SCOPES); setOpen(o => !o); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
          title="Editar escopos"
        >
          ✎
        </button>
        <button
          onClick={() => onRemove(viewer.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 13, padding: '2px 4px' }}
          title="Remover acesso"
        >
          ✕
        </button>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Módulos com acesso
          </div>
          <ScopeCheckboxes value={scopes} onChange={setScopes} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Btn variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn variant="primary" size="sm" onClick={handleSave} disabled={saving || scopes.length === 0}>
              {saving ? '...' : 'Salvar'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewerAccessSection({ user }) {
  const [viewers, setViewers] = useState([]);
  const [email, setEmail] = useState('');
  const [newScopes, setNewScopes] = useState(DEFAULT_SCOPES);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchViewers();
  }, [user]);

  async function fetchViewers() {
    setLoading(true);
    const { data } = await supabase
      .from('viewer_access')
      .select('id, viewer_email, scopes, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true });
    setViewers(data ?? []);
    setLoading(false);
  }

  async function handleAdd() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || newScopes.length === 0) return;
    setAdding(true);
    setError('');
    const { error: err } = await supabase
      .from('viewer_access')
      .insert({ owner_id: user.id, viewer_email: trimmed, scopes: newScopes });
    if (err) {
      setError(err.code === '23505' ? 'Email já possui acesso.' : err.message);
    } else {
      setEmail('');
      setNewScopes(DEFAULT_SCOPES);
      setShowForm(false);
      await fetchViewers();
    }
    setAdding(false);
  }

  function handleRemove(id) {
    supabase.from('viewer_access').delete().eq('id', id);
    setViewers(prev => prev.filter(v => v.id !== id));
  }

  function handleUpdateScopes(id, scopes) {
    setViewers(prev => prev.map(v => v.id === id ? { ...v, scopes } : v));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
        Viewers instalam o APK, criam conta com email/senha e visualizam apenas os módulos que você liberar — sem conseguir editar nada.
      </p>

      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Carregando...</p>
      ) : viewers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {viewers.map(v => (
            <ViewerRow
              key={v.id}
              viewer={v}
              onRemove={handleRemove}
              onUpdateScopes={handleUpdateScopes}
            />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>Nenhum viewer com acesso.</p>
      )}

      {showForm ? (
        <div style={{
          background: 'oklch(14% 0.016 38)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <InputRow
            label="Email do viewer"
            type="text"
            value={email}
            onChange={setEmail}
            placeholder="email@exemplo.com"
          />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Módulos com acesso
            </div>
            <ScopeCheckboxes value={newScopes} onChange={setNewScopes} />
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => { setShowForm(false); setEmail(''); setNewScopes(DEFAULT_SCOPES); setError(''); }}>
              Cancelar
            </Btn>
            <Btn variant="primary" size="sm" onClick={handleAdd} disabled={adding || !email.trim() || newScopes.length === 0}>
              {adding ? '...' : 'Convidar'}
            </Btn>
          </div>
        </div>
      ) : (
        <Btn variant="ghost" size="sm" onClick={() => setShowForm(true)} style={{ alignSelf: 'flex-start' }}>
          + Convidar viewer
        </Btn>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--text-dim)' }}>Como criar a conta do viewer:</strong> Supabase dashboard → Authentication → Users → Invite User → email do viewer. O viewer recebe um link para definir senha.
      </p>
    </div>
  );
}

export default function ConfigModal({ open, onClose, settings, onSave, isViewer, user }) {
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('empresa');

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

  const tabs = [
    { key: 'empresa', label: 'Empresa' },
    ...(!isViewer ? [{ key: 'viewers', label: 'Acesso' }] : []),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      onOpen={handleOpen}
      title="Configurações"
      footer={
        activeTab === 'empresa' ? (
          <>
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn variant="primary" onClick={handleSave}>Salvar</Btn>
          </>
        ) : (
          <Btn variant="ghost" onClick={onClose}>Fechar</Btn>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  background: activeTab === t.key ? 'var(--accent-dim)' : 'none',
                  border: 'none', cursor: 'pointer',
                  color: activeTab === t.key ? 'var(--accent)' : 'var(--text-dim)',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
                  padding: '5px 12px', borderRadius: 6,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab: Empresa */}
        {activeTab === 'empresa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
              Dados usados nos recibos de prestação de serviço.
            </p>
            <InputRow label="Razão Social" value={form.empresa} onChange={set('empresa')} placeholder="Nome da empresa" disabled={isViewer} />
            <InputRow label="CNPJ" value={form.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0000-00" disabled={isViewer} />
            <InputRow label="Endereço" value={form.endereco} onChange={set('endereco')} placeholder="Endereço completo" disabled={isViewer} />
            <InputRow label="Cidade" value={form.cidade} onChange={set('cidade')} placeholder="Cidade - UF" disabled={isViewer} />
          </div>
        )}

        {/* Tab: Acesso de Viewers */}
        {activeTab === 'viewers' && !isViewer && (
          <ViewerAccessSection user={user} />
        )}

        {/* Sobre */}
        <div style={{
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>FabricaLog</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>Forno CEDAN</span>
            {isViewer && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'oklch(76% 0.17 68)', background: 'oklch(76% 0.17 68 / 0.12)',
                padding: '2px 6px', borderRadius: 4, marginLeft: 8,
              }}>
                Modo Visualização
              </span>
            )}
          </div>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11, fontWeight: 600,
            color: 'var(--accent)', background: 'var(--accent-dim)',
            padding: '3px 9px', borderRadius: 99, letterSpacing: '0.04em',
          }}>
            v{__APP_VERSION__}
          </span>
        </div>
      </div>
    </Modal>
  );
}
