import { supabase } from './supabase';

export async function pushToCloud({ semanas, pontos, employees, settings, forno, carregamentos }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('app_data').upsert(
    { user_id: user.id, semanas, pontos, employees, settings, forno, carregamentos, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}

export async function pullFromCloud() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if this user is a viewer for someone else's data
  const { data: invite } = await supabase
    .from('viewer_access')
    .select('owner_id, scopes')
    .eq('viewer_email', user.email)
    .maybeSingle();

  const targetId = invite?.owner_id ?? user.id;
  const isViewer = !!invite?.owner_id;
  const viewerScopes = invite?.scopes ?? null;

  const { data, error } = await supabase
    .from('app_data')
    .select('semanas, pontos, employees, settings, forno, carregamentos, updated_at')
    .eq('user_id', targetId)
    .single();

  if (error || !data) return null;
  return { ...data, isViewer, viewerScopes };
}
