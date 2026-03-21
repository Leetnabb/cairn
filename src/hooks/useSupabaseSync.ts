import { useAuth } from '../providers/AuthProvider';

export function useSupabaseSync() {
  // Placeholder — workspace sync disabled for now.
  // localStorage persistence (via Zustand persist middleware) handles state.
  // Full Supabase workspace sync will be enabled once the data model is stable.
  useAuth(); // keep the dependency so the hook is valid
}
