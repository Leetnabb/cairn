import { supabase } from './supabase';

export async function saveWorkspaceToSupabase(workspaceId: string, name: string, state: object): Promise<void> {
  if (!supabase) return;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return;

  await supabase
    .from('workspaces')
    .upsert({
      id: workspaceId,
      user_id: session.user.id,
      name,
      state,
    }, { onConflict: 'id' });
}

export async function loadWorkspaceFromSupabase(workspaceId: string): Promise<object | null> {
  if (!supabase) return null;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return null;

  const { data } = await supabase
    .from('workspaces')
    .select('state')
    .eq('id', workspaceId)
    .single();

  return data?.state ?? null;
}

export async function listWorkspacesFromSupabase(): Promise<Array<{ id: string; name: string; updated_at: string }>> {
  if (!supabase) return [];
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return [];

  const { data } = await supabase
    .from('workspaces')
    .select('id, name, updated_at')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false });

  return data ?? [];
}

export async function createWorkspaceInSupabase(name: string, state: object): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Not authenticated');

  const id = crypto.randomUUID();
  await supabase
    .from('workspaces')
    .insert({
      id,
      user_id: session.user.id,
      name,
      state,
    });

  return id;
}
