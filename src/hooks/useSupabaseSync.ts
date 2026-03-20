import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { useAuth } from '../providers/AuthProvider';
import { saveWorkspaceToSupabase, loadWorkspaceFromSupabase, listWorkspacesFromSupabase, createWorkspaceInSupabase } from '../lib/workspace';
import type { AppState } from '../types';

export function useSupabaseSync() {
  const { isAuthenticated, userId } = useAuth();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadedRef = useRef(false);

  // Load workspace from Supabase on auth
  useEffect(() => {
    if (!isAuthenticated || !userId || loadedRef.current) return;
    loadedRef.current = true;

    async function loadWorkspace() {
      try {
        const workspaces = await listWorkspacesFromSupabase();
        if (workspaces.length > 0) {
          // Load the most recent workspace
          const state = await loadWorkspaceFromSupabase(workspaces[0].id);
          if (state) {
            useStore.getState().importState(state as Partial<AppState>);
          }
        } else {
          // New user — check for existing localStorage data to migrate
          const localData = localStorage.getItem('cairn-storage');
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              if (parsed.state) {
                await createWorkspaceInSupabase('Hovedscenario', parsed.state);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      } catch (err) {
        console.error('Failed to load workspace from Supabase:', err);
      }
    }
    loadWorkspace();
  }, [isAuthenticated, userId]);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsub = useStore.subscribe(() => {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const workspaces = await listWorkspacesFromSupabase();
          if (workspaces.length > 0) {
            const state = useStore.getState();
            await saveWorkspaceToSupabase(workspaces[0].id, workspaces[0].name, state);
          }
        } catch (err) {
          console.error('Failed to save workspace:', err);
        }
      }, 2000);
    });

    return () => {
      unsub();
      clearTimeout(saveTimeoutRef.current);
    };
  }, [isAuthenticated]);
}
