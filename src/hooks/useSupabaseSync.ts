import { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useStore } from '../stores/useStore';
import { supabase } from '../lib/supabase';
import type { AppState } from '../types';
import {
  fetchPrimaryWorkspace,
  createWorkspace,
  saveWorkspace,
} from '../lib/workspace';

const WORKSPACE_NAME = 'Hovedscenario';
const SAVE_DEBOUNCE_MS = 1500;
const RETRY_MS = 8000;

// The data fields we sync (everything except UI state, actions and local snapshots).
const DATA_KEYS = [
  'strategies', 'capabilities', 'scenarios', 'scenarioStates', 'activeScenario',
  'milestones', 'valueChains', 'effects', 'comments', 'modules', 'strategicFrame',
] as const;

type StoreSnapshot = ReturnType<typeof useStore.getState>;

/** Cheap change detection: the field references (immutable updates ⇒ ref changes iff data changed). */
function dataRefs(state: StoreSnapshot): unknown[] {
  const s = state as unknown as Record<string, unknown>;
  return DATA_KEYS.map((k) => s[k]);
}

function refsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
  return true;
}

/** Payload for the remote. strategicFrame is written as null (not omitted) so clearing it syncs. */
function serializeWorkspace(state: StoreSnapshot): object {
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
    strategicFrame: state.strategicFrame ?? null,
  };
}

/**
 * Validate + whitelist a remote payload before hydrating. Returns null (⇒ stay
 * local, do not touch the store) if the payload is unusable. Only known data
 * fields are applied — never arbitrary keys like `ui` — and the
 * activeScenario⇒scenarioStates invariant the store relies on is enforced.
 */
export function sanitizeRemoteState(remote: unknown): Partial<AppState> | null {
  if (typeof remote !== 'object' || remote === null) return null;
  const r = remote as Record<string, unknown>;

  const scenarioStates = r.scenarioStates;
  if (typeof scenarioStates !== 'object' || scenarioStates === null || Array.isArray(scenarioStates)) return null;
  const ssKeys = Object.keys(scenarioStates as Record<string, unknown>);
  if (ssKeys.length === 0) return null;

  let active = typeof r.activeScenario === 'string' ? r.activeScenario : '';
  if (!(active in (scenarioStates as Record<string, unknown>))) active = ssKeys[0];

  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const patch: Partial<AppState> = {
    strategies: arr(r.strategies),
    capabilities: arr(r.capabilities),
    scenarios: arr(r.scenarios),
    scenarioStates: scenarioStates as AppState['scenarioStates'],
    activeScenario: active,
    milestones: arr(r.milestones),
    valueChains: arr(r.valueChains),
    effects: arr(r.effects),
    comments: arr(r.comments),
    // null (cleared) ⇒ undefined; object ⇒ keep; anything else ⇒ leave unset.
    strategicFrame: r.strategicFrame && typeof r.strategicFrame === 'object'
      ? (r.strategicFrame as AppState['strategicFrame'])
      : undefined,
  };
  if (r.modules && typeof r.modules === 'object') {
    patch.modules = r.modules as AppState['modules'];
  }
  return patch;
}

/**
 * Syncs the local store with the user's Supabase workspace (Supabase is the
 * source of truth across devices; localStorage is an offline cache).
 *
 * Safety properties:
 *  - Hydration is not recorded by undo (temporal paused), so Ctrl+Z can't
 *    resurrect pre-login state and push it to the cloud.
 *  - Saves use optimistic concurrency (updated_at); a lost race adopts remote
 *    instead of clobbering it.
 *  - Failed saves are retried; the tab flushes pending changes when hidden or
 *    unmounted. Any hard failure falls back to localStorage-only.
 */
export function useSupabaseSync() {
  const { isAuthenticated, userId } = useAuth();

  useEffect(() => {
    if (import.meta.env.VITE_DISABLE_SUPABASE_SYNC === 'true') return;
    if (!supabase || !isAuthenticated || !userId) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let workspaceId: string | null = null;
    let remoteUpdatedAt = '';
    let savedRefs: unknown[] = [];
    let saving = false;
    let pendingWhileSaving = false;

    const hydrate = (patch: Partial<AppState>, updatedAt: string) => {
      const temporal = useStore.temporal.getState();
      temporal.pause();
      useStore.setState(patch);
      temporal.resume();
      remoteUpdatedAt = updatedAt;
      savedRefs = dataRefs(useStore.getState());
    };

    const scheduleSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => void commit(), SAVE_DEBOUNCE_MS);
    };
    const scheduleRetry = () => {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => void commit(), RETRY_MS);
    };

    async function commit() {
      if (!workspaceId) return;
      if (saving) { pendingWhileSaving = true; return; }

      const state = useStore.getState();
      const refs = dataRefs(state);
      if (refsEqual(refs, savedRefs)) return;

      saving = true;
      try {
        const res = await saveWorkspace(workspaceId, WORKSPACE_NAME, serializeWorkspace(state), remoteUpdatedAt);
        if (res.ok) {
          remoteUpdatedAt = res.updated_at;
          savedRefs = refs; // only mark saved AFTER success
        } else if (!cancelled) {
          // Another writer won — adopt remote rather than clobber it.
          console.warn('[useSupabaseSync] remote changed underneath; adopting remote copy');
          const clean = res.conflict ? sanitizeRemoteState(res.conflict.state) : null;
          if (clean && res.conflict) hydrate(clean, res.conflict.updated_at);
        }
      } catch (e) {
        console.error('[useSupabaseSync] save failed, will retry', e);
        scheduleRetry(); // leave savedRefs stale so the change is retried
      } finally {
        saving = false;
        if (pendingWhileSaving && !cancelled) {
          pendingWhileSaving = false;
          scheduleSave();
        }
      }
    }

    async function init() {
      try {
        const remote = await fetchPrimaryWorkspace();
        if (cancelled) return;

        if (remote) {
          workspaceId = remote.id;
          const clean = sanitizeRemoteState(remote.state);
          if (clean) hydrate(clean, remote.updated_at);
          else { remoteUpdatedAt = remote.updated_at; savedRefs = dataRefs(useStore.getState()); }
        } else {
          const created = await createWorkspace(WORKSPACE_NAME, serializeWorkspace(useStore.getState()));
          if (cancelled) return;
          workspaceId = created.id;
          remoteUpdatedAt = created.updated_at;
          savedRefs = dataRefs(useStore.getState());
        }
      } catch (e) {
        console.error('[useSupabaseSync] init failed, staying in local-only mode', e);
        return;
      }
      if (cancelled) return;

      const storeUnsub = useStore.subscribe(() => {
        if (refsEqual(dataRefs(useStore.getState()), savedRefs)) return;
        scheduleSave();
      });
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') void commit();
      };
      document.addEventListener('visibilitychange', onVisibility);
      unsubscribe = () => {
        storeUnsub();
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }

    void init();

    return () => {
      cancelled = true;
      clearTimeout(saveTimer);
      clearTimeout(retryTimer);
      unsubscribe?.();
      // Best-effort flush of pending edits on unmount / logout.
      if (workspaceId && !refsEqual(dataRefs(useStore.getState()), savedRefs)) {
        void commit();
      }
    };
  }, [isAuthenticated, userId]);
}
