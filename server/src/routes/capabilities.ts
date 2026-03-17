import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireWriter } from '../auth/middleware.js';
import { requireCapabilitiesModule } from '../middleware/planEnforcement.js';
import { CapabilityRepository } from '../repositories/CapabilityRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  maturity: z.number().int().min(1).max(5).optional(),
});

const updateSchema = createSchema.partial();

export async function capabilityRoutes(app: FastifyInstance) {
  const preHandler = [authenticate, requireCapabilitiesModule];
  const writePreHandler = [authenticate, requireCapabilitiesModule, requireWriter];

  app.get<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId/capabilities',
    { preHandler },
    async (request, reply) => {
      const repo = new CapabilityRepository(request.ctx.schemaName, request.ctx.tenantId);
      return reply.send(await repo.findByScenario(request.params.scenarioId));
    }
  );

  app.get<{ Params: { id: string } }>(
    '/capabilities/:id',
    { preHandler },
    async (request, reply) => {
      const repo = new CapabilityRepository(request.ctx.schemaName, request.ctx.tenantId);
      const cap = await repo.findById(request.params.id);
      if (!cap) return reply.code(404).send({ error: 'Capability not found' });
      return reply.send(cap);
    }
  );

  app.post<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId/capabilities',
    { preHandler: writePreHandler },
    async (request, reply) => {
      const data = createSchema.parse(request.body);
      const repo = new CapabilityRepository(request.ctx.schemaName, request.ctx.tenantId);
      const cap = await repo.create({ ...data, scenarioId: request.params.scenarioId });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'capability.create',
        entityType: 'capability',
        entityId: cap.id,
        request,
      });

      return reply.code(201).send(cap);
    }
  );

  app.patch<{ Params: { id: string } }>(
    '/capabilities/:id',
    { preHandler: writePreHandler },
    async (request, reply) => {
      const data = updateSchema.parse(request.body);
      const repo = new CapabilityRepository(request.ctx.schemaName, request.ctx.tenantId);
      const cap = await repo.update(request.params.id, data);
      if (!cap) return reply.code(404).send({ error: 'Capability not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'capability.update',
        entityType: 'capability',
        entityId: cap.id,
        payload: data as Record<string, unknown>,
        request,
      });

      return reply.send(cap);
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/capabilities/:id',
    { preHandler: writePreHandler },
    async (request, reply) => {
      const repo = new CapabilityRepository(request.ctx.schemaName, request.ctx.tenantId);
      const deleted = await repo.delete(request.params.id);
      if (!deleted) return reply.code(404).send({ error: 'Capability not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'capability.delete',
        entityType: 'capability',
        entityId: request.params.id,
        request,
      });

      return reply.code(204).send();
    }
  );
}
