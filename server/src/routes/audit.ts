import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../auth/middleware.js';
import { requireAuditLogAccess } from '../middleware/planEnforcement.js';
import { AuditRepository } from '../repositories/AuditRepository.js';

export async function auditRoutes(app: FastifyInstance) {
  // GET /audit — list audit events for the tenant
  app.get(
    '/audit',
    { preHandler: [authenticate, requireAdmin, requireAuditLogAccess] },
    async (request, reply) => {
      const { limit, offset, action } = z.object({
        limit: z.coerce.number().int().min(1).max(200).optional().default(100),
        offset: z.coerce.number().int().min(0).optional().default(0),
        action: z.string().optional(),
      }).parse(request.query);

      const [events, total] = await Promise.all([
        AuditRepository.findByTenant(request.ctx.tenantId, { limit, offset, action }),
        AuditRepository.countByTenant(request.ctx.tenantId),
      ]);

      return reply.send({ events, total, limit, offset });
    }
  );
}
