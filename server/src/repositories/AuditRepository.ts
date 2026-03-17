import { FastifyRequest } from 'fastify';
import { queryPublic } from '../db/pool.js';
import type { AuditEvent } from '../types/index.js';

interface LogParams {
  tenantId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  request?: FastifyRequest;
}

/**
 * Audit repository — append-only, operates on cairn_public.audit_events.
 * No update or delete methods by design.
 */
export class AuditRepository {
  static async log(params: LogParams): Promise<void> {
    const ipAddress = params.request?.ip ?? null;
    const userAgent = params.request?.headers['user-agent'] ?? null;

    // Fire-and-forget: audit logging must not break the main request
    queryPublic(
      `INSERT INTO cairn_public.audit_events
         (id, tenant_id, user_id, action, entity_type, entity_id, payload, ip_address, user_agent)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.tenantId,
        params.userId ?? null,
        params.action,
        params.entityType ?? null,
        params.entityId ?? null,
        params.payload ? JSON.stringify(params.payload) : null,
        ipAddress,
        userAgent,
      ]
    ).catch(err => console.error('[audit] Failed to log event:', err));
  }

  static async findByTenant(
    tenantId: string,
    options: { limit?: number; offset?: number; action?: string } = {}
  ): Promise<AuditEvent[]> {
    const { limit = 100, offset = 0, action } = options;
    const values: unknown[] = [tenantId, limit, offset];
    let actionClause = '';
    if (action) {
      values.push(action);
      actionClause = `AND action = $${values.length}`;
    }

    const { rows } = await queryPublic<Record<string, unknown>>(
      `SELECT id, tenant_id, user_id, action, entity_type, entity_id, payload,
              ip_address, user_agent, created_at
       FROM cairn_public.audit_events
       WHERE tenant_id = $1 ${actionClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      values
    );

    return rows.map(r => ({
      id: r.id as string,
      tenantId: r.tenant_id as string,
      userId: r.user_id as string | undefined,
      action: r.action as string,
      entityType: r.entity_type as string | undefined,
      entityId: r.entity_id as string | undefined,
      payload: r.payload as Record<string, unknown> | undefined,
      ipAddress: r.ip_address as string | undefined,
      userAgent: r.user_agent as string | undefined,
      createdAt: new Date(r.created_at as string),
    }));
  }

  static async countByTenant(tenantId: string): Promise<number> {
    const { rows } = await queryPublic<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM cairn_public.audit_events WHERE tenant_id = $1`,
      [tenantId]
    );
    return parseInt(rows[0].cnt);
  }
}
