import { useMemo } from 'react';

type TenantRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'BOARD';
type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

interface AuthContext {
  isAuthenticated: boolean;
  role: TenantRole | null;
  plan: PlanTier | null;
  tenantId: string | null;
  userId: string | null;
}

/**
 * Decode the JWT from localStorage to extract role, plan, and tenant info.
 * This is for UI display/gating only — server re-verifies on every request.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function useAuthContext(): AuthContext {
  return useMemo(() => {
    const token = localStorage.getItem('cairn_access_token');
    if (!token) {
      return { isAuthenticated: false, role: null, plan: null, tenantId: null, userId: null };
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      return { isAuthenticated: false, role: null, plan: null, tenantId: null, userId: null };
    }

    // Supabase stores custom claims in app_metadata or directly
    const appMeta = (payload.app_metadata ?? payload) as Record<string, unknown>;

    return {
      isAuthenticated: true,
      role: (appMeta.role as TenantRole) ?? null,
      plan: (appMeta.plan as PlanTier) ?? null,
      tenantId: (appMeta.tenant_id as string) ?? null,
      userId: (payload.sub as string) ?? null,
    };
  }, []);
}
