import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { queryPublic } from '../db/pool.js';
import type { JWTPayload, RequestContext, TenantRole, PlanTier } from '../types/index.js';

// Supabase client — used only to verify JWTs
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Augment FastifyRequest with the resolved context.
 */
declare module 'fastify' {
  interface FastifyRequest {
    ctx: RequestContext;
  }
}

/**
 * Extract and verify the Supabase JWT from the Authorization header.
 * Resolves tenant_id from the JWT claim ONLY — never from URL or body.
 * Attaches RequestContext to request.ctx.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.slice(7);

  // Verify JWT with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }

  // Extract custom claims set by Supabase Edge Function / hook
  const claims = user.app_metadata as Partial<JWTPayload>;
  const tenantId = claims.tenant_id;
  const role = claims.role as TenantRole | undefined;
  const plan = claims.plan as PlanTier | undefined;

  if (!tenantId) {
    return reply.code(401).send({ error: 'Token does not contain tenant_id claim' });
  }

  // Look up tenant schema name from public schema
  const { rows } = await queryPublic<{ schema_name: string; plan: PlanTier }>(
    `SELECT schema_name, plan FROM cairn_public.tenants WHERE id = $1 AND deletion_scheduled_at IS NULL`,
    [tenantId]
  );

  if (rows.length === 0) {
    return reply.code(403).send({ error: 'Tenant not found or pending deletion' });
  }

  request.ctx = {
    userId: user.id,
    tenantId,
    role: role ?? 'VIEWER',
    plan: plan ?? rows[0].plan,
    schemaName: rows[0].schema_name,
  };
}

/**
 * Require specific roles — use after authenticate().
 */
export function requireRole(...allowedRoles: TenantRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!allowedRoles.includes(request.ctx.role)) {
      return reply.code(403).send({
        error: `Requires one of: ${allowedRoles.join(', ')}. Your role: ${request.ctx.role}`,
      });
    }
  };
}

/**
 * Convenience: require write access (OWNER, ADMIN, EDITOR)
 */
export const requireWriter = requireRole('OWNER', 'ADMIN', 'EDITOR');

/**
 * Convenience: require admin access (OWNER, ADMIN)
 */
export const requireAdmin = requireRole('OWNER', 'ADMIN');

/**
 * Convenience: require owner only
 */
export const requireOwner = requireRole('OWNER');
