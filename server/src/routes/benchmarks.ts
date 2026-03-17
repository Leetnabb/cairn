import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../auth/middleware.js';
import { requireBenchmarkAccess } from '../middleware/planEnforcement.js';
import { BenchmarkRepository } from '../repositories/BenchmarkRepository.js';

const validMetrics = [
  'initiative_count',
  'near_horizon_pct',
  'far_horizon_pct',
  'confirmed_pct',
  'tentative_pct',
  'under_consideration_pct',
  'dimension_gini',
  'capability_coverage',
  'effect_linkage',
  'critical_path_length',
] as const;

const percentileSchema = z.object({
  metric: z.enum(validMetrics),
  value: z.number(),
  planTier: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
});

const distributionSchema = z.object({
  metric: z.enum(validMetrics),
  planTier: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
});

export async function benchmarkRoutes(app: FastifyInstance) {
  const preHandler = [authenticate, requireBenchmarkAccess];

  // POST /benchmarks/percentile
  app.post(
    '/benchmarks/percentile',
    { preHandler },
    async (request, reply) => {
      const data = percentileSchema.parse(request.body);
      const repo = new BenchmarkRepository();
      const result = await repo.getPercentile(
        request.ctx.tenantId,
        data.metric,
        data.value,
        data.planTier
      );

      if (!result) {
        return reply.send({
          insufficient_data: true,
          min_sample: 10,
          message: 'Not enough benchmark data to compute percentile (minimum 10 samples required).',
        });
      }

      return reply.send(result);
    }
  );

  // POST /benchmarks/distribution
  app.post(
    '/benchmarks/distribution',
    { preHandler },
    async (request, reply) => {
      const data = distributionSchema.parse(request.body);
      const repo = new BenchmarkRepository();
      const result = await repo.getDistribution(data.metric, data.planTier);

      if (!result) {
        return reply.send({
          insufficient_data: true,
          min_sample: 10,
          message: 'Not enough benchmark data to compute distribution (minimum 10 samples required).',
        });
      }

      return reply.send(result);
    }
  );
}
