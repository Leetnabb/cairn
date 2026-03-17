import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireAdmin, requireOwner } from '../auth/middleware.js';
import { requireAuditLogAccess } from '../middleware/planEnforcement.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { BenchmarkRepository } from '../repositories/BenchmarkRepository.js';
import { queryPublic } from '../db/pool.js';
import { dropTenantSchema } from '../db/provision.js';
import { PLAN_LIMITS } from '../types/index.js';

const updateOrgSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  sector: z.enum(['public', 'finance', 'energy', 'telecom']).nullable().optional(),
  orgSizeband: z.enum(['small', 'medium', 'large']).nullable().optional(),
});

export async function settingsRoutes(app: FastifyInstance) {
  // GET /settings/org — organisation info
  app.get('/settings/org', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { rows } = await queryPublic<Record<string, unknown>>(
      `SELECT id, slug, display_name, plan, sector, org_sizeband, created_at FROM cairn_public.tenants WHERE id = $1`,
      [request.ctx.tenantId]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Tenant not found' });

    const limits = PLAN_LIMITS[request.ctx.plan];
    return reply.send({ ...rows[0], limits });
  });

  // PATCH /settings/org — update org name, sector, sizeband
  app.patch('/settings/org', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const data = updateOrgSchema.parse(request.body);
    const setClauses: string[] = [];
    const values: unknown[] = [request.ctx.tenantId];
    let i = 2;

    if (data.displayName !== undefined) {
      setClauses.push(`display_name = $${i++}`);
      values.push(data.displayName);
    }
    if (data.sector !== undefined) {
      setClauses.push(`sector = $${i++}`);
      values.push(data.sector);
    }
    if (data.orgSizeband !== undefined) {
      setClauses.push(`org_sizeband = $${i++}`);
      values.push(data.orgSizeband);
    }

    if (setClauses.length === 0) {
      const { rows } = await queryPublic<Record<string, unknown>>(
        `SELECT id, slug, display_name, plan, sector, org_sizeband FROM cairn_public.tenants WHERE id = $1`,
        [request.ctx.tenantId]
      );
      return reply.send(rows[0]);
    }

    const { rows } = await queryPublic<Record<string, unknown>>(
      `UPDATE cairn_public.tenants SET ${setClauses.join(', ')}
       WHERE id = $1 RETURNING id, slug, display_name, plan, sector, org_sizeband`,
      values
    );
    return reply.send(rows[0]);
  });

  // GET /settings/plan — plan info + limits
  app.get('/settings/plan', { preHandler: [authenticate] }, async (request, reply) => {
    const limits = PLAN_LIMITS[request.ctx.plan];
    return reply.send({ plan: request.ctx.plan, limits });
  });

  // GET /settings/audit — audit log (ENTERPRISE only)
  app.get(
    '/settings/audit',
    { preHandler: [authenticate, requireAdmin, requireAuditLogAccess] },
    async (request, reply) => {
      const { limit, offset, action } = z.object({
        limit: z.coerce.number().int().min(1).max(200).optional().default(100),
        offset: z.coerce.number().int().min(0).optional().default(0),
        action: z.string().optional(),
      }).parse(request.query);

      const events = await AuditRepository.findByTenant(request.ctx.tenantId, {
        limit,
        offset,
        action,
      });
      const total = await AuditRepository.countByTenant(request.ctx.tenantId);
      return reply.send({ events, total, limit, offset });
    }
  );

  // GET /settings/data/export — GDPR data export
  app.get(
    '/settings/data/export',
    { preHandler: [authenticate, requireOwner] },
    async (request, reply) => {
      const { schemaName, tenantId } = request.ctx;

      // Collect all data across tenant schema tables
      const [scenarios, capabilities, initiatives, effects, snapshots] = await Promise.all([
        queryPublic(`SELECT * FROM "${schemaName}".scenarios`),
        queryPublic(`SELECT * FROM "${schemaName}".capabilities`),
        queryPublic(`SELECT * FROM "${schemaName}".initiatives`),
        queryPublic(`SELECT * FROM "${schemaName}".effects`),
        queryPublic(`SELECT id, scenario_id, label, created_at FROM "${schemaName}".snapshots`),
        // Note: snapshot.state (potentially large) excluded from export by default
      ]);

      const members = await queryPublic(
        `SELECT tm.user_id, u.email, u.display_name, tm.role, tm.created_at
         FROM cairn_public.tenant_memberships tm
         LEFT JOIN cairn_public.users u ON u.id = tm.user_id
         WHERE tm.tenant_id = $1`,
        [tenantId]
      );

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="cairn-export-${new Date().toISOString().split('T')[0]}.json"`);

      return reply.send({
        exportedAt: new Date().toISOString(),
        tenantId,
        data: {
          scenarios: scenarios.rows,
          capabilities: capabilities.rows,
          initiatives: initiatives.rows,
          effects: effects.rows,
          snapshots: snapshots.rows,
          members: members.rows,
        },
      });
    }
  );

  // POST /settings/data/request-deletion — GDPR deletion (30-day grace)
  app.post(
    '/settings/data/request-deletion',
    { preHandler: [authenticate, requireOwner] },
    async (request, reply) => {
      const scheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await queryPublic(
        `UPDATE cairn_public.tenants
         SET deletion_requested_at = NOW(), deletion_scheduled_at = $2
         WHERE id = $1 AND deletion_requested_at IS NULL`,
        [request.ctx.tenantId, scheduledAt]
      );

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'tenant.deletion_requested',
        payload: { scheduledAt: scheduledAt.toISOString() },
        request,
      });

      return reply.send({
        message: 'Deletion scheduled. Your account and all data will be permanently deleted after the grace period.',
        scheduledAt: scheduledAt.toISOString(),
        canCancelUntil: scheduledAt.toISOString(),
      });
    }
  );

  // POST /settings/data/cancel-deletion — cancel pending GDPR deletion
  app.post(
    '/settings/data/cancel-deletion',
    { preHandler: [authenticate, requireOwner] },
    async (request, reply) => {
      const { rowCount } = await queryPublic(
        `UPDATE cairn_public.tenants
         SET deletion_requested_at = NULL, deletion_scheduled_at = NULL
         WHERE id = $1 AND deletion_scheduled_at > NOW()`,
        [request.ctx.tenantId]
      );

      if ((rowCount ?? 0) === 0) {
        return reply.code(400).send({ error: 'No pending deletion to cancel, or grace period has expired' });
      }

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'tenant.deletion_cancelled',
        request,
      });

      return reply.send({ message: 'Deletion cancelled.' });
    }
  );
}
