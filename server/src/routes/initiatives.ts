import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireWriter } from '../auth/middleware.js';
import { enforceInitiativeLimit } from '../middleware/planEnforcement.js';
import { InitiativeRepository } from '../repositories/InitiativeRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';

const createSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().optional(),
  horizon: z.enum(['near', 'far']).optional(),
  dimension: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'done', 'blocked']).optional(),
  confidence: z.enum(['confirmed', 'tentative', 'under_consideration']).optional(),
  owner: z.string().optional(),
  milestoneId: z.string().uuid().optional(),
  dependsOn: z.array(z.string().uuid()).optional(),
  capabilities: z.array(z.string().uuid()).optional(),
  sortOrder: z.number().int().optional(),
});

const updateSchema = createSchema.partial();

export async function initiativeRoutes(app: FastifyInstance) {
  // GET /scenarios/:scenarioId/initiatives
  app.get<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId/initiatives',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const repo = new InitiativeRepository(request.ctx.schemaName, request.ctx.tenantId);
      const initiatives = await repo.findByScenario(request.params.scenarioId);
      return reply.send(initiatives);
    }
  );

  // GET /initiatives/:id
  app.get<{ Params: { id: string } }>(
    '/initiatives/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const repo = new InitiativeRepository(request.ctx.schemaName, request.ctx.tenantId);
      const initiative = await repo.findById(request.params.id);
      if (!initiative) return reply.code(404).send({ error: 'Initiative not found' });
      return reply.send(initiative);
    }
  );

  // POST /scenarios/:scenarioId/initiatives
  app.post<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId/initiatives',
    { preHandler: [authenticate, requireWriter, enforceInitiativeLimit] },
    async (request, reply) => {
      const data = createSchema.parse(request.body);
      const repo = new InitiativeRepository(request.ctx.schemaName, request.ctx.tenantId);
      const initiative = await repo.create({ ...data, scenarioId: request.params.scenarioId });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'initiative.create',
        entityType: 'initiative',
        entityId: initiative.id,
        request,
      });

      return reply.code(201).send(initiative);
    }
  );

  // PATCH /initiatives/:id
  app.patch<{ Params: { id: string } }>(
    '/initiatives/:id',
    { preHandler: [authenticate, requireWriter] },
    async (request, reply) => {
      const data = updateSchema.parse(request.body);
      const repo = new InitiativeRepository(request.ctx.schemaName, request.ctx.tenantId);
      const initiative = await repo.update(request.params.id, data);
      if (!initiative) return reply.code(404).send({ error: 'Initiative not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'initiative.update',
        entityType: 'initiative',
        entityId: initiative.id,
        payload: data as Record<string, unknown>,
        request,
      });

      return reply.send(initiative);
    }
  );

  // DELETE /initiatives/:id
  app.delete<{ Params: { id: string } }>(
    '/initiatives/:id',
    { preHandler: [authenticate, requireWriter] },
    async (request, reply) => {
      const repo = new InitiativeRepository(request.ctx.schemaName, request.ctx.tenantId);
      const deleted = await repo.delete(request.params.id);
      if (!deleted) return reply.code(404).send({ error: 'Initiative not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'initiative.delete',
        entityType: 'initiative',
        entityId: request.params.id,
        request,
      });

      return reply.code(204).send();
    }
  );
}
