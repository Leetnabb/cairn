import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireWriter } from '../auth/middleware.js';
import { enforceScenarioLimit } from '../middleware/planEnforcement.js';
import { ScenarioRepository } from '../repositories/ScenarioRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  strategyId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export async function scenarioRoutes(app: FastifyInstance) {
  // GET /scenarios
  app.get('/scenarios', { preHandler: [authenticate] }, async (request, reply) => {
    const repo = new ScenarioRepository(request.ctx.schemaName, request.ctx.tenantId);
    const scenarios = await repo.findAll();
    return reply.send(scenarios);
  });

  // GET /scenarios/:id
  app.get<{ Params: { id: string } }>(
    '/scenarios/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const repo = new ScenarioRepository(request.ctx.schemaName, request.ctx.tenantId);
      const scenario = await repo.findById(request.params.id);
      if (!scenario) return reply.code(404).send({ error: 'Scenario not found' });
      return reply.send(scenario);
    }
  );

  // POST /scenarios
  app.post(
    '/scenarios',
    { preHandler: [authenticate, requireWriter, enforceScenarioLimit] },
    async (request, reply) => {
      const data = createSchema.parse(request.body);
      const repo = new ScenarioRepository(request.ctx.schemaName, request.ctx.tenantId);
      const scenario = await repo.create(data);

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'scenario.create',
        entityType: 'scenario',
        entityId: scenario.id,
        request,
      });

      return reply.code(201).send(scenario);
    }
  );

  // PATCH /scenarios/:id
  app.patch<{ Params: { id: string } }>(
    '/scenarios/:id',
    { preHandler: [authenticate, requireWriter] },
    async (request, reply) => {
      const data = updateSchema.parse(request.body);
      const repo = new ScenarioRepository(request.ctx.schemaName, request.ctx.tenantId);
      const scenario = await repo.update(request.params.id, data);
      if (!scenario) return reply.code(404).send({ error: 'Scenario not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'scenario.update',
        entityType: 'scenario',
        entityId: scenario.id,
        payload: data,
        request,
      });

      return reply.send(scenario);
    }
  );

  // DELETE /scenarios/:id
  app.delete<{ Params: { id: string } }>(
    '/scenarios/:id',
    { preHandler: [authenticate, requireWriter] },
    async (request, reply) => {
      const repo = new ScenarioRepository(request.ctx.schemaName, request.ctx.tenantId);
      try {
        const deleted = await repo.delete(request.params.id);
        if (!deleted) return reply.code(404).send({ error: 'Scenario not found' });
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('default scenario')) {
          return reply.code(400).send({ error: err.message });
        }
        throw err;
      }

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'scenario.delete',
        entityType: 'scenario',
        entityId: request.params.id,
        request,
      });

      return reply.code(204).send();
    }
  );
}
