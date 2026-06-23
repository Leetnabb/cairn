import { supabase } from './supabase';

/**
 * Supabase workspace persistence. This is the single source of truth for
 * cross-device sync (localStorage acts only as an offline cache). All functions
 * surface real errors instead of swallowing them, so callers can fall back to
 * local-only mode deliberately.
 */

// PostgREST "no rows" code returned by .single() when nothing matches.
const NO_ROWS = 'PGRST116';

export async function saveWorkspaceToSupabase(workspaceId: string, name: string, state: object): Promise<void> {
  if (!supabase) return;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return;

  const { error } = await supabase
    .from('workspaces')
    .upsert({
      id: workspaceId,
      user_id: session.user.id,
      name,
      state,
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function loadWorkspaceFromSupabase(workspaceId: string): Promise<object | null> {
  if (!supabase) return null;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return null;

  const { data, error } = await supabase
    .from('workspaces')
    .select('state')
    .eq('id', workspaceId)
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    // "Not found" is an expected, non-exceptional outcome — distinguish it from
    // a real transport/permission failure so callers don't treat a transient
    // error as "no workspace" and overwrite good data.
    if (error.code === NO_ROWS) return null;
    throw error;
  }

  return data?.state ?? null;
}

export async function listWorkspacesFromSupabase(): Promise<Array<{ id: string; name: string; updated_at: string }>> {
  if (!supabase) return [];
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return [];

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, updated_at')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createWorkspaceInSupabase(name: string, state: object): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Not authenticated');

  const id = crypto.randomUUID();
  const { error } = await supabase
    .from('workspaces')
    .insert({
      id,
      user_id: session.user.id,
      name,
      state,
    });

  if (error) throw error;
  return id;
}
