import { queryPublic } from '../db/pool.js';
import { anonymiseId } from '../services/benchmarkExtractor.js';
import type {
  BenchmarkVector,
  BenchmarkPercentile,
  BenchmarkDistribution,
  PlanTier,
} from '../types/index.js';
import { BENCHMARK_MIN_SAMPLE } from '../types/index.js';
import type { ExtractedBenchmarkVector } from '../services/benchmarkExtractor.js';

type InsertParams = ExtractedBenchmarkVector & {
  tenantId: string;
  snapshotId: string;
};

// Columns available for percentile / distribution queries
const VALID_METRICS = new Set([
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
]);

export class BenchmarkRepository {
  async insert(params: InsertParams): Promise<void> {
    const tenantHash = anonymiseId(params.tenantId);
    const snapshotHash = anonymiseId(params.snapshotId);

    await queryPublic(
      `INSERT INTO cairn_public.benchmark_vectors (
         id, tenant_hash, snapshot_hash,
         initiative_count, near_horizon_pct, far_horizon_pct,
         confirmed_pct, tentative_pct, under_consideration_pct,
         dimension_gini, capability_coverage, effect_linkage,
         critical_path_length, plan_tier
       ) VALUES (
         gen_random_uuid(), $1, $2,
         $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
       ) ON CONFLICT (snapshot_hash) DO NOTHING`,
      [
        tenantHash,
        snapshotHash,
        params.initiativeCount,
        params.nearHorizonPct,
        params.farHorizonPct,
        params.confirmedPct,
        params.tentativePct,
        params.underConsiderationPct,
        params.dimensionGini,
        params.capabilityCoverage,
        params.effectLinkage,
        params.criticalPathLength,
        params.planTier,
      ]
    );
  }

  /**
   * Get where a tenant's value sits in the benchmark distribution.
   * Returns null if insufficient sample size (< BENCHMARK_MIN_SAMPLE).
   * Excludes the requesting tenant's own data from comparison.
   */
  async getPercentile(
    tenantId: string,
    metric: string,
    value: number,
    planTierFilter?: PlanTier
  ): Promise<BenchmarkPercentile | null> {
    if (!VALID_METRICS.has(metric)) {
      throw new Error(`Invalid benchmark metric: ${metric}`);
    }

    const tenantHash = anonymiseId(tenantId);
    const values: unknown[] = [tenantHash, value];
    let planClause = '';
    if (planTierFilter) {
      values.push(planTierFilter);
      planClause = `AND plan_tier = $${values.length}`;
    }

    const { rows } = await queryPublic<{ percentile: number; sample_size: number }>(
      `SELECT
         ROUND(
           100.0 * SUM(CASE WHEN ${metric} <= $2 THEN 1 ELSE 0 END)::numeric
           / COUNT(*)::numeric
         ) AS percentile,
         COUNT(*) AS sample_size
       FROM cairn_public.benchmark_vectors
       WHERE tenant_hash != $1
         AND ${metric} IS NOT NULL
         ${planClause}`,
      values
    );

    const row = rows[0];
    if (!row || row.sample_size < BENCHMARK_MIN_SAMPLE) return null;

    return {
      metric,
      value,
      percentile: Number(row.percentile),
      sampleSize: Number(row.sample_size),
    };
  }

  /**
   * Get distribution statistics for a metric.
   * Returns null if insufficient sample size.
   */
  async getDistribution(
    metric: string,
    planTierFilter?: PlanTier
  ): Promise<BenchmarkDistribution | null> {
    if (!VALID_METRICS.has(metric)) {
      throw new Error(`Invalid benchmark metric: ${metric}`);
    }

    const values: unknown[] = [];
    let planClause = '';
    if (planTierFilter) {
      values.push(planTierFilter);
      planClause = `WHERE plan_tier = $1 AND ${metric} IS NOT NULL`;
    } else {
      planClause = `WHERE ${metric} IS NOT NULL`;
    }

    const { rows } = await queryPublic<{
      p25: number;
      p50: number;
      p75: number;
      mean: number;
      sample_size: number;
    }>(
      `SELECT
         PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${metric}) AS p25,
         PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${metric}) AS p50,
         PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${metric}) AS p75,
         AVG(${metric}) AS mean,
         COUNT(*) AS sample_size
       FROM cairn_public.benchmark_vectors
       ${planClause}`,
      values
    );

    const row = rows[0];
    if (!row || row.sample_size < BENCHMARK_MIN_SAMPLE) return null;

    return {
      metric,
      p25: Number(row.p25),
      p50: Number(row.p50),
      p75: Number(row.p75),
      mean: Number(row.mean),
      sampleSize: Number(row.sample_size),
    };
  }

  /**
   * Anonymise all vectors for a tenant (GDPR — called before tenant deletion).
   */
  async anonymiseTenant(tenantId: string): Promise<void> {
    const tenantHash = anonymiseId(tenantId);
    // Replace tenant hash with a random irreversible value
    const newHash = anonymiseId(`${tenantId}-deleted-${Date.now()}`);
    await queryPublic(
      `UPDATE cairn_public.benchmark_vectors SET tenant_hash = $2 WHERE tenant_hash = $1`,
      [tenantHash, newHash]
    );
  }
}
