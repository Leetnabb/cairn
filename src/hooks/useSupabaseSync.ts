import { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useStore } from '../stores/useStore';
import { supabase } from '../lib/supabase';
import type { AppState } from '../types';
import {
  listWorkspacesFromSupabase,
  loadWorkspaceFromSupabase,
  saveWorkspaceToSupabase,
  createWorkspaceInSupabase,
} from '../lib/workspace';

const WORKSPACE_NAME = 'Hovedscenario';
const SAVE_DEBOUNCE_MS = 1500;

/** Persisted data fields (everything except UI state, transient actions and local snapshots). */
function serializeWorkspace(state: ReturnType<typeof useStore.getState>): Partial<AppState> {
  return {
    strategies: state.strategies,
    capabilities: state.capabilities,
    scenarios: state.scenarios,
    scenarioStates: state.scenarioStates,
    activeScenario: state.activeScenario,
    milestones: state.milestones,
    valueChains: state.valueChains,
    effects: state.effects,
    comments: state.comments,
    modules: state.modules,
    strategicFrame: state.strategicFrame,
  };
}

/** A remote payload is only safe to hydrate from if it actually carries data. */
function isMeaningful(state: unknown): state is Partial<AppState> {
  return (
    typeof state === 'object' &&
    state !== null &&
    'scenarioStates' in state &&
    typeof (state as Record<string, unknown>).scenarioStates === 'object'
  );
}

/**
 * Syncs the local store with the user's Supabase workspace.
 *
 * Strategy (Supabase is the source of truth across devices; localStorage is an
 * offline cache):
 *  - On login, pull the remote workspace and hydrate the store. If no remote
 *    workspace exists yet, seed it from current local state.
 *  - Afterwards, push local changes back up (debounced).
 *  - Any failure leaves the app in localStorage-only mode and never clobbers
 *    local data.
 */
export function useSupabaseSync() {
  const { isAuthenticated, userId } = useAuth();

  useEffect(() => {
    if (!supabase || !isAuthenticated || !userId) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let workspaceId: string | null = null;
    let lastSaved = '';

    async function init() {
      try {
        const list = await listWorkspacesFromSupabase();
        if (cancelled) return;

        if (list.length > 0) {
          workspaceId = list[0].id;
          const remote = await loadWorkspaceFromSupabase(workspaceId);
          if (cancelled) return;
          if (isMeaningful(remote)) {
            useStore.setState(remote);
            lastSaved = JSON.stringify(remote);
          }
        } else {
          // First login on this account — seed remote from current local state.
          const snapshot = serializeWorkspace(useStore.getState());
          workspaceId = await createWorkspaceInSupabase(WORKSPACE_NAME, snapshot);
          lastSaved = JSON.stringify(snapshot);
        }
      } catch (err) {
        // Stay local-only; never overwrite local data on a sync failure.
        console.error('[useSupabaseSync] init failed, staying in local-only mode', err);
        return;
      }

      if (cancelled) return;

      // Push local → remote on subsequent changes (debounced, skip no-ops).
      unsubscribe = useStore.subscribe((state) => {
        if (!workspaceId) return;
        const serialized = JSON.stringify(serializeWorkspace(state));
        if (serialized === lastSaved) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const id = workspaceId;
          if (!id) return;
          lastSaved = serialized;
          saveWorkspaceToSupabase(id, WORKSPACE_NAME, JSON.parse(serialized))
            .catch((e) => console.error('[useSupabaseSync] save failed', e));
        }, SAVE_DEBOUNCE_MS);
      });
    }

    void init();

    return () => {
      cancelled = true;
      clearTimeout(saveTimer);
      unsubscribe?.();
    };
  }, [isAuthenticated, userId]);
}
