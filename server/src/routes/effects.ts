import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireWriter } from '../auth/middleware.js';
import { requireEffectsModule } from '../middleware/planEnforcement.js';
import { EffectRepository } from '../repositories/EffectRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';

const createSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().optional(),
  initiatives: z.array(z.string().uuid()).optional(),
});

const updateSchema = createSchema.partial();

export async function effectRoutes(app: FastifyInstance) {
  const preHandler = [authenticate, requireEffectsModule];
  const writePreHandler = [authenticate, requireEffectsModule, requireWriter];

  app.get<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId/effects',
    { preHandler },
    async (request, reply) => {
      const repo = new EffectRepository(request.ctx.schemaName, request.ctx.tenantId);
      return reply.send(await repo.findByScenario(request.params.scenarioId));
    }
  );

  app.get<{ Params: { id: string } }>(
    '/effects/:id',
    { preHandler },
    async (request, reply) => {
      const repo = new EffectRepository(request.ctx.schemaName, request.ctx.tenantId);
      const effect = await repo.findById(request.params.id);
      if (!effect) return reply.code(404).send({ error: 'Effect not found' });
      return reply.send(effect);
    }
  );

  app.post<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId/effects',
    { preHandler: writePreHandler },
    async (request, reply) => {
      const data = createSchema.parse(request.body);
      const repo = new EffectRepository(request.ctx.schemaName, request.ctx.tenantId);
      const effect = await repo.create({ ...data, scenarioId: request.params.scenarioId });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'effect.create',
        entityType: 'effect',
        entityId: effect.id,
        request,
      });

      return reply.code(201).send(effect);
    }
  );

  app.patch<{ Params: { id: string } }>(
    '/effects/:id',
    { preHandler: writePreHandler },
    async (request, reply) => {
      const data = updateSchema.parse(request.body);
      const repo = new EffectRepository(request.ctx.schemaName, request.ctx.tenantId);
      const effect = await repo.update(request.params.id, data);
      if (!effect) return reply.code(404).send({ error: 'Effect not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'effect.update',
        entityType: 'effect',
        entityId: effect.id,
        payload: data as Record<string, unknown>,
        request,
      });

      return reply.send(effect);
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/effects/:id',
    { preHandler: writePreHandler },
    async (request, reply) => {
      const repo = new EffectRepository(request.ctx.schemaName, request.ctx.tenantId);
      const deleted = await repo.delete(request.params.id);
      if (!deleted) return reply.code(404).send({ error: 'Effect not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'effect.delete',
        entityType: 'effect',
        entityId: request.params.id,
        request,
      });

      return reply.code(204).send();
    }
  );
}
