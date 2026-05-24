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

const ROLE_LABELS = { viewer: 'Visualizador', editor: 'Editor' };
const ROLE_COLORS = {
  viewer: { color: 'oklch(76% 0.17 68)', bg: 'oklch(76% 0.17 68 / 0.12)' },
  editor: { color: 'oklch(72% 0.18 145)', bg: 'oklch(72% 0.18 145 / 0.12)' },
};

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

  const role = viewer.role ?? 'viewer';
  const roleStyle = ROLE_COLORS[role] ?? ROLE_COLORS.viewer;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            {viewer.label && (
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {viewer.label}
              </div>
            )}
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '1px 5px', borderRadius: 3,
              color: roleStyle.color, background: roleStyle.bg,
            }}>
              {ROLE_LABELS[role]}
            </span>
            {viewer.forno_key && (
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-dim)',
                background: 'oklch(20% 0.01 38)', padding: '1px 5px', borderRadius: 3,
              }}>
                {viewer.forno_key}
              </span>
            )}
          </div>
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

function toFornoKey(label) {
  return label.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    || Date.now().toString(36);
}

function FornosSection({ adminFornos, onUpdateFornos }) {
  const [fornos, setFornos] = useState(() => adminFornos?.length ? adminFornos : [{ key: 'cedan', label: '' }]);
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleRename(key, label) {
    const updated = fornos.map(f => f.key === key ? { ...f, label } : f);
    setFornos(updated);
  }

  async function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    const key = toFornoKey(label);
    if (fornos.find(f => f.key === key)) return;
    const updated = [...fornos, { key, label }];
    setFornos(updated);
    setNewLabel('');
  }

  async function handleRemove(key) {
    if (fornos.length <= 1) return;
    setFornos(prev => prev.filter(f => f.key !== key));
  }

  async function handleSave() {
    setSaving(true);
    await onUpdateFornos(fornos);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
        Cada forno tem dados independentes — equipe, ponto e produção separados. Editores e visualizadores são associados a um forno específico.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {fornos.map(f => (
          <div key={f.key} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'oklch(14% 0.016 38)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono, monospace)', marginBottom: 4 }}>{f.key}</div>
              <input
                value={f.label}
                onChange={e => handleRename(f.key, e.target.value)}
                placeholder="Nome do forno"
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)',
                }}
              />
            </div>
            {fornos.length > 1 && (
              <button onClick={() => handleRemove(f.key)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 13, padding: '2px 4px' }}
                title="Remover forno">✕</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nome do novo forno"
          style={{
            flex: 1, background: 'oklch(14% 0.016 38)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 10px', fontFamily: 'var(--font)', fontSize: 12,
            color: 'var(--text)', outline: 'none',
          }}
        />
        <Btn variant="ghost" size="sm" onClick={handleAdd} disabled={!newLabel.trim()}>+ Adicionar</Btn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Btn variant="primary" size="sm" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? '...' : 'Salvar fornos'}
        </Btn>
        {saved && (
          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Salvo ✓</span>
        )}
      </div>
    </div>
  );
}

function ViewerAccessSection({ user, adminFornos }) {
  const [viewers, setViewers] = useState([]);
  const [email, setEmail] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newScopes, setNewScopes] = useState(DEFAULT_SCOPES);
  const [newRole, setNewRole] = useState('viewer');
  const [newFornoKey, setNewFornoKey] = useState('');
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
      .select('id, viewer_email, label, scopes, role, forno_key, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true });
    setViewers(data ?? []);
    setLoading(false);
  }

  async function handleAdd() {
    const trimmed = email.trim().toLowerCase();
    const fornoKey = newFornoKey || adminFornos?.[0]?.key || 'cedan';
    if (!trimmed || newScopes.length === 0) return;
    if (viewers.some(v => v.viewer_email === trimmed && (v.forno_key ?? 'cedan') === fornoKey)) {
      setError('Este email já tem acesso a este forno.');
      return;
    }
    setAdding(true);
    setError('');
    const { error: err } = await supabase
      .from('viewer_access')
      .insert({ owner_id: user.id, viewer_email: trimmed, scopes: newScopes, label: newLabel.trim() || null, role: newRole, forno_key: fornoKey });
    if (err) {
      setError(err.code === '23505' ? 'Este email já tem acesso a este forno.' : err.message);
    } else {
      setEmail('');
      setNewLabel('');
      setNewScopes(DEFAULT_SCOPES);
      setNewRole('viewer');
      setNewFornoKey('');
      setShowForm(false);
      await fetchViewers();
    }
    setAdding(false);
  }

  async function handleRemove(id) {
    const { error } = await supabase.from('viewer_access').delete().eq('id', id);
    if (!error) setViewers(prev => prev.filter(v => v.id !== id));
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
            label="Nome do forno (exibido no seletor)"
            type="text"
            value={newLabel}
            onChange={setNewLabel}
            placeholder="ex: Forno Contínuo"
          />
          <InputRow
            label="Email"
            type="text"
            value={email}
            onChange={setEmail}
            placeholder="email@exemplo.com"
          />
          {adminFornos?.length > 1 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Forno
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {adminFornos.map(f => {
                  const active = (newFornoKey || adminFornos[0]?.key) === f.key;
                  return (
                    <button key={f.key} type="button" onClick={() => setNewFornoKey(f.key)}
                      style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
                        fontFamily: 'var(--font)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        background: active ? 'var(--accent-dim)' : 'transparent',
                        color: active ? 'var(--accent)' : 'var(--text-dim)',
                        transition: 'all 0.15s',
                      }}>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Tipo de acesso
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { value: 'viewer', label: 'Visualizador', desc: 'Lê seus dados, sem editar' },
                { value: 'editor', label: 'Editor', desc: 'Gerencia dados próprios' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewRole(opt.value)}
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font)',
                    border: `1px solid ${newRole === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: newRole === opt.value ? 'var(--accent-dim)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: newRole === opt.value ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Módulos com acesso
            </div>
            <ScopeCheckboxes value={newScopes} onChange={setNewScopes} />
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => { setShowForm(false); setEmail(''); setNewLabel(''); setNewScopes(DEFAULT_SCOPES); setNewRole('viewer'); setNewFornoKey(''); setError(''); }}>
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

export default function ConfigModal({ open, onClose, settings, onSave, isViewer, isEditor, user, adminFornos, activeForno }) {
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
    ...(!isViewer && !isEditor ? [{ key: 'fornos', label: 'Fornos' }] : []),
    ...(!isViewer && !isEditor ? [{ key: 'viewers', label: 'Acesso' }] : []),
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
        ) : <Btn variant="ghost" onClick={onClose}>Fechar</Btn>
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

            {!isViewer && !isEditor && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Módulos ativos
                </div>
                <ScopeCheckboxes
                  value={form.modulosAtivos ?? ALL_SCOPES.map(s => s.key)}
                  onChange={v => setForm(prev => ({ ...prev, modulosAtivos: v.length === ALL_SCOPES.length ? null : v }))}
                />
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                  Desmarque os módulos que não utiliza para simplificar a navegação.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Fornos */}
        {activeTab === 'fornos' && !isViewer && !isEditor && (
          <FornosSection
            adminFornos={adminFornos}
            onUpdateFornos={async (fornoList) => {
              onSave({ fornoList });
            }}
          />
        )}

        {/* Tab: Acesso de Viewers */}
        {activeTab === 'viewers' && !isViewer && (
          <ViewerAccessSection user={user} adminFornos={adminFornos} />
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
            {(() => {
              const label = adminFornos?.find(f => f.key === activeForno)?.label ?? adminFornos?.[0]?.label;
              return label ? (
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>{label}</span>
              ) : null;
            })()}
            {(isViewer || isEditor) && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: isEditor ? 'oklch(72% 0.18 145)' : 'oklch(76% 0.17 68)',
                background: isEditor ? 'oklch(72% 0.18 145 / 0.12)' : 'oklch(76% 0.17 68 / 0.12)',
                padding: '2px 6px', borderRadius: 4, marginLeft: 8,
              }}>
                {isEditor ? 'Modo Editor' : 'Modo Visualização'}
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
