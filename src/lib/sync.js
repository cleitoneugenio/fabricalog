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

  const { data, error } = await supabase
    .from('app_data')
    .select('semanas, pontos, employees, settings, forno, carregamentos, updated_at')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return data;
}
