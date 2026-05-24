import { supabase } from './supabase';

// adminUserId: para editors, é o user_id do admin dono dos dados
// fornoKey:    qual fatia de dados gravar (ex: 'cedan', 'continuo')
export async function pushToCloud({ adminUserId, fornoKey, semanas, pontos, employees, settings, forno, carregamentos }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const targetId = adminUserId ?? user.id;
  const key = fornoKey ?? 'cedan';

  // Lê os fornos atuais para não sobrescrever outros fornos
  const { data: current } = await supabase
    .from('app_data')
    .select('fornos')
    .eq('user_id', targetId)
    .maybeSingle();

  const updatedFornos = {
    ...(current?.fornos ?? {}),
    [key]: { employees, pontos, semanas, forno, carregamentos },
  };

  await supabase.from('app_data').upsert(
    { user_id: targetId, fornos: updatedFornos, settings, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}

// Extrai slice de dados de um forno específico, com compat para formato antigo (colunas flat)
function _extractSlice(appData, fornoKey) {
  if (appData.fornos) {
    const s = appData.fornos[fornoKey] ?? {};
    return {
      employees:     s.employees     ?? [],
      pontos:        s.pontos        ?? [],
      semanas:       s.semanas       ?? [],
      forno:         s.forno         ?? {},
      carregamentos: s.carregamentos ?? [],
    };
  }
  // Formato antigo — colunas flat
  return {
    employees:     appData.employees     ?? [],
    pontos:        appData.pontos        ?? [],
    semanas:       appData.semanas       ?? [],
    forno:         appData.forno         ?? {},
    carregamentos: appData.carregamentos ?? [],
  };
}

async function _fetchAppData(userId) {
  const { data } = await supabase
    .from('app_data')
    .select('fornos, settings, semanas, pontos, employees, forno, carregamentos, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  return data ?? null;
}

// activeFornoKey — forno selecionado (null = auto)
// activeOwnerId  — owner já selecionado (usado quando há múltiplos admins, raro)
export async function pullFromCloud(activeFornoKey = null, activeOwnerId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: invites } = await supabase
    .from('viewer_access')
    .select('owner_id, label, scopes, role, forno_key')
    .eq('viewer_email', user.email);

  // ── Admin puro ───────────────────────────────────────────────────────────
  if (!invites || invites.length === 0) {
    const appData = await _fetchAppData(user.id);
    if (!appData) return null;

    const fornoList = appData.settings?.fornoList;
    const rawKeys   = appData.fornos ? Object.keys(appData.fornos) : ['cedan'];
    const adminFornos = fornoList ?? rawKeys.map(k => ({ key: k, label: k }));
    const resolvedKey = activeFornoKey ?? adminFornos[0]?.key ?? 'cedan';

    return {
      ..._extractSlice(appData, resolvedKey),
      settings:     appData.settings ?? {},
      isViewer:     false,
      isEditor:     false,
      viewerScopes: null,
      viewerInvites: [],
      activeForno:  resolvedKey,
      adminFornos,
      adminUserId:  user.id,
      needsFornoPicker: false,
    };
  }

  // ── Viewer ou Editor ─────────────────────────────────────────────────────
  const invite = activeFornoKey
    ? (invites.find(i => i.forno_key === activeFornoKey) ?? invites[0])
    : activeOwnerId
      ? (invites.find(i => i.owner_id === activeOwnerId) ?? invites[0])
      : invites[0];

  const needsFornoPicker = invites.length > 1 && !activeFornoKey && !activeOwnerId;
  const isEditor  = (invite.role ?? 'viewer') === 'editor';
  const fornoKey  = invite.forno_key ?? 'cedan';

  const appData = await _fetchAppData(invite.owner_id);

  // Editor sem dados do admin ainda (conta nova)
  if (!appData && isEditor) {
    return {
      employees: [], pontos: [], semanas: [], forno: {}, carregamentos: [],
      settings:  {},
      isViewer:  false,
      isEditor:  true,
      viewerScopes:  invite.scopes ?? null,
      viewerInvites: invites,
      activeForno:   fornoKey,
      adminFornos:   [{ key: fornoKey, label: invite.label ?? fornoKey }],
      adminUserId:   invite.owner_id,
      needsFornoPicker,
    };
  }

  if (!appData) return null;

  return {
    ..._extractSlice(appData, fornoKey),
    settings:      appData.settings ?? {},
    isViewer:      !isEditor,
    isEditor,
    viewerScopes:  invite.scopes ?? null,
    viewerInvites: invites,
    activeForno:   fornoKey,
    adminFornos:   [{ key: fornoKey, label: invite.label ?? fornoKey }],
    adminUserId:   invite.owner_id,
    needsFornoPicker,
  };
}
