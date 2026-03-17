import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../auth/middleware.js';
import { requireBenchmarkAccess } from '../middleware/planEnforcement.js';
import { BenchmarkRepository } from '../repositories/BenchmarkRepository.js';

const validMetrics = [
  'initiative_count',
  'capability_count',
  'effect_count',
  'near_horizon_pct',
  'far_horizon_pct',
  'confirmed_pct',
  'tentative_pct',
  'under_consideration_pct',
  'dimension_gini',
  'capability_coverage',
  'effect_linkage',
  'critical_path_length',
  'avg_capability_maturity',
  'avg_capability_risk',
  'capabilities_with_no_initiatives',
  'effects_with_no_initiatives',
  'initiatives_with_no_effects',
  'max_owner_load',
  'scenario_count',
] as const;

const percentileSchema = z.object({
  metric: z.enum(validMetrics),
  value: z.number(),
  planTier: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
  sector: z.string().optional(),
  orgSizeband: z.string().optional(),
});

const distributionSchema = z.object({
  metric: z.enum(validMetrics),
  planTier: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
  sector: z.string().optional(),
  orgSizeband: z.string().optional(),
});

const correlationSchema = z.object({
  metricA: z.enum(validMetrics),
  metricB: z.enum(validMetrics),
  sector: z.string().optional(),
  orgSizeband: z.string().optional(),
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
        data.planTier,
        data.sector,
        data.orgSizeband
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
      const result = await repo.getDistribution(
        data.metric,
        data.planTier,
        data.sector,
        data.orgSizeband
      );

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

  // POST /benchmarks/correlation
  app.post(
    '/benchmarks/correlation',
    { preHandler },
    async (request, reply) => {
      const data = correlationSchema.parse(request.body);
      const repo = new BenchmarkRepository();
      const result = await repo.getCorrelation(
        data.metricA,
        data.metricB,
        data.sector,
        data.orgSizeband
      );

      if (!result) {
        return reply.send({
          insufficient_data: true,
          min_sample: 10,
          message: 'Not enough benchmark data to compute correlation (minimum 10 samples required).',
        });
      }

      return reply.send(result);
    }
  );
}
