import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireWriter } from '../auth/middleware.js';
import { SnapshotRepository } from '../repositories/SnapshotRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { extractBenchmarkVector } from '../services/benchmarkExtractor.js';
import { BenchmarkRepository } from '../repositories/BenchmarkRepository.js';
import { queryPublic } from '../db/pool.js';

const createSchema = z.object({
  label: z.string().min(1).max(200),
  state: z.record(z.unknown()),
  submitToBenchmark: z.boolean().optional().default(false),
});

export async function snapshotRoutes(app: FastifyInstance) {
  app.get<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId/snapshots',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const repo = new SnapshotRepository(request.ctx.schemaName, request.ctx.tenantId);
      return reply.send(await repo.findByScenario(request.params.scenarioId));
    }
  );

  app.get<{ Params: { id: string } }>(
    '/snapshots/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const repo = new SnapshotRepository(request.ctx.schemaName, request.ctx.tenantId);
      const snapshot = await repo.findById(request.params.id);
      if (!snapshot) return reply.code(404).send({ error: 'Snapshot not found' });
      return reply.send(snapshot);
    }
  );

  app.post<{ Params: { scenarioId: string } }>(
    '/scenarios/:scenarioId/snapshots',
    { preHandler: [authenticate, requireWriter] },
    async (request, reply) => {
      const data = createSchema.parse(request.body);
      const repo = new SnapshotRepository(request.ctx.schemaName, request.ctx.tenantId);

      const snapshot = await repo.create({
        scenarioId: request.params.scenarioId,
        label: data.label,
        state: data.state,
        createdBy: request.ctx.userId,
      });

      // Optionally submit to benchmark pool (PRO/ENTERPRISE)
      if (data.submitToBenchmark) {
        try {
          const vector = extractBenchmarkVector(data.state, request.ctx.plan);
          if (vector) {
            // Fetch tenant's opt-in sector/sizeband for benchmark filtering
            const { rows: tenantRows } = await queryPublic<{ sector: string | null; org_sizeband: string | null }>(
              `SELECT sector, org_sizeband FROM cairn_public.tenants WHERE id = $1`,
              [request.ctx.tenantId]
            );
            const tenant = tenantRows[0];

            const benchRepo = new BenchmarkRepository();
            await benchRepo.insert({
              tenantId: request.ctx.tenantId,
              snapshotId: snapshot.id,
              sector: tenant?.sector ?? undefined,
              orgSizeband: tenant?.org_sizeband ?? undefined,
              ...vector,
            });
            await repo.markBenchmarked(snapshot.id);
          }
        } catch (err) {
          console.error('[benchmark] Failed to extract/insert vector:', err);
          // Non-fatal: snapshot still saved
        }
      }

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'snapshot.create',
        entityType: 'snapshot',
        entityId: snapshot.id,
        request,
      });

      return reply.code(201).send(snapshot);
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/snapshots/:id',
    { preHandler: [authenticate, requireWriter] },
    async (request, reply) => {
      const repo = new SnapshotRepository(request.ctx.schemaName, request.ctx.tenantId);
      const deleted = await repo.delete(request.params.id);
      if (!deleted) return reply.code(404).send({ error: 'Snapshot not found' });

      await AuditRepository.log({
        tenantId: request.ctx.tenantId,
        userId: request.ctx.userId,
        action: 'snapshot.delete',
        entityType: 'snapshot',
        entityId: request.params.id,
        request,
      });

      return reply.code(204).send();
    }
  );
}
