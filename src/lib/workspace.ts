import { supabase } from './supabase';

/**
 * Supabase workspace persistence. This is the source of truth for cross-device
 * sync (localStorage is an offline cache). Reads return null on "no session";
 * writes THROW on "no session" so the caller can surface/retry instead of
 * silently no-op'ing. Saves use optimistic concurrency on `updated_at` so a
 * stale tab/device cannot blindly clobber newer remote data.
 */

export interface WorkspaceRecord {
  id: string;
  state: unknown;
  updated_at: string;
}

export type SaveResult =
  | { ok: true; updated_at: string }
  | { ok: false; conflict: WorkspaceRecord | null };

async function requireSession() {
  if (!supabase) throw new Error('Supabase not configured');
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Not authenticated');
  return { client: supabase, userId: session.user.id };
}

/** The user's most-recently-updated workspace, or null if they have none. */
export async function fetchPrimaryWorkspace(): Promise<WorkspaceRecord | null> {
  if (!supabase) return null;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return null;

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, state, updated_at')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? { id: data.id, state: data.state, updated_at: data.updated_at } : null;
}

/**
 * Create the user's workspace. Best-effort idempotency: re-checks for an
 * existing workspace first so a second tab racing first-login reuses it rather
 * than creating a duplicate (a unique (user_id, name) index would close the
 * remaining narrow window — see supabase/README.md).
 */
export async function createWorkspace(name: string, state: object): Promise<WorkspaceRecord> {
  const { client, userId } = await requireSession();

  const existing = await fetchPrimaryWorkspace();
  if (existing) return existing;

  const { data, error } = await client
    .from('workspaces')
    .insert({ user_id: userId, name, state })
    .select('id, state, updated_at')
    .single();

  if (error) throw error;
  return { id: data.id, state: data.state, updated_at: data.updated_at };
}

/**
 * Save state with optimistic concurrency. The update only applies if the row's
 * `updated_at` still equals `expectedUpdatedAt`; otherwise another writer won
 * and we return the current remote so the caller can resync instead of clobber.
 */
export async function saveWorkspace(
  id: string,
  name: string,
  state: object,
  expectedUpdatedAt: string,
): Promise<SaveResult> {
  const { client, userId } = await requireSession();

  const { data, error } = await client
    .from('workspaces')
    .update({ name, state })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    // No row matched the expected updated_at → concurrent write (or row gone).
    const current = await fetchPrimaryWorkspace();
    return { ok: false, conflict: current };
  }
  return { ok: true, updated_at: data.updated_at };
}
