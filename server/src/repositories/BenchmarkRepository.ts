import { queryPublic } from '../db/pool.js';
import { anonymiseId } from '../services/benchmarkExtractor.js';
import type {
  BenchmarkPercentile,
  BenchmarkDistribution,
  BenchmarkCorrelation,
  PlanTier,
} from '../types/index.js';
import { BENCHMARK_MIN_SAMPLE } from '../types/index.js';
import type { ExtractedBenchmarkVector } from '../services/benchmarkExtractor.js';

type InsertParams = ExtractedBenchmarkVector & {
  tenantId: string;
  snapshotId: string;
  sector?: string;
  orgSizeband?: string;
};

// Columns available for percentile / distribution / correlation queries
const VALID_METRICS = new Set([
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
]);

export class BenchmarkRepository {
  async insert(params: InsertParams): Promise<void> {
    const tenantHash = anonymiseId(params.tenantId);
    const snapshotHash = anonymiseId(params.snapshotId);

    await queryPublic(
      `INSERT INTO cairn_public.benchmark_vectors (
         id, tenant_hash, snapshot_hash,
         initiative_count, capability_count, effect_count,
         near_horizon_pct, far_horizon_pct,
         confirmed_pct, tentative_pct, under_consideration_pct,
         dimension_gini, capability_coverage, effect_linkage,
         critical_path_length,
         initiatives_per_dimension, avg_capability_maturity, avg_capability_risk,
         capabilities_with_no_initiatives, effects_with_no_initiatives,
         initiatives_with_no_effects, max_owner_load, scenario_count,
         effect_type_distribution, sector, org_sizeband, plan_tier
       ) VALUES (
         gen_random_uuid(), $1, $2,
         $3, $4, $5,
         $6, $7,
         $8, $9, $10,
         $11, $12, $13,
         $14,
         $15, $16, $17,
         $18, $19,
         $20, $21, $22,
         $23, $24, $25, $26
       ) ON CONFLICT (snapshot_hash) DO NOTHING`,
      [
        tenantHash,
        snapshotHash,
        params.initiativeCount,
        params.capabilityCount,
        params.effectCount,
        params.nearHorizonPct,
        params.farHorizonPct,
        params.confirmedPct,
        params.tentativePct,
        params.underConsiderationPct,
        params.dimensionGini,
        params.capabilityCoverage,
        params.effectLinkage,
        params.criticalPathLength,
        JSON.stringify(params.initiativesPerDimension),
        params.avgCapabilityMaturity,
        params.avgCapabilityRisk,
        params.capabilitiesWithNoInitiatives,
        params.effectsWithNoInitiatives,
        params.initiativesWithNoEffects,
        params.maxOwnerLoad,
        params.scenarioCount,
        JSON.stringify(params.effectTypeDistribution),
        params.sector ?? null,
        params.orgSizeband ?? null,
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
    planTierFilter?: PlanTier,
    sectorFilter?: string,
    orgSizebandFilter?: string
  ): Promise<BenchmarkPercentile | null> {
    if (!VALID_METRICS.has(metric)) {
      throw new Error(`Invalid benchmark metric: ${metric}`);
    }

    const tenantHash = anonymiseId(tenantId);
    const values: unknown[] = [tenantHash, value];
    const clauses: string[] = [];
    if (planTierFilter) {
      values.push(planTierFilter);
      clauses.push(`AND plan_tier = $${values.length}`);
    }
    if (sectorFilter) {
      values.push(sectorFilter);
      clauses.push(`AND sector = $${values.length}`);
    }
    if (orgSizebandFilter) {
      values.push(orgSizebandFilter);
      clauses.push(`AND org_sizeband = $${values.length}`);
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
         ${clauses.join(' ')}`,
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
    planTierFilter?: PlanTier,
    sectorFilter?: string,
    orgSizebandFilter?: string
  ): Promise<BenchmarkDistribution | null> {
    if (!VALID_METRICS.has(metric)) {
      throw new Error(`Invalid benchmark metric: ${metric}`);
    }

    const values: unknown[] = [];
    const clauses: string[] = [`${metric} IS NOT NULL`];
    if (planTierFilter) {
      values.push(planTierFilter);
      clauses.push(`plan_tier = $${values.length}`);
    }
    if (sectorFilter) {
      values.push(sectorFilter);
      clauses.push(`sector = $${values.length}`);
    }
    if (orgSizebandFilter) {
      values.push(orgSizebandFilter);
      clauses.push(`org_sizeband = $${values.length}`);
    }

    const whereClause = `WHERE ${clauses.join(' AND ')}`;

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
       ${whereClause}`,
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
   * Get correlation between two metrics.
   * Returns null if insufficient sample size.
   */
  async getCorrelation(
    metricA: string,
    metricB: string,
    sectorFilter?: string,
    orgSizebandFilter?: string
  ): Promise<BenchmarkCorrelation | null> {
    if (!VALID_METRICS.has(metricA)) {
      throw new Error(`Invalid benchmark metric: ${metricA}`);
    }
    if (!VALID_METRICS.has(metricB)) {
      throw new Error(`Invalid benchmark metric: ${metricB}`);
    }

    const values: unknown[] = [];
    const clauses: string[] = [`${metricA} IS NOT NULL`, `${metricB} IS NOT NULL`];
    if (sectorFilter) {
      values.push(sectorFilter);
      clauses.push(`sector = $${values.length}`);
    }
    if (orgSizebandFilter) {
      values.push(orgSizebandFilter);
      clauses.push(`org_sizeband = $${values.length}`);
    }

    const whereClause = `WHERE ${clauses.join(' AND ')}`;

    const { rows } = await queryPublic<{
      correlation: number | null;
      sample_size: number;
    }>(
      `SELECT
         CORR(${metricA}::numeric, ${metricB}::numeric) AS correlation,
         COUNT(*) AS sample_size
       FROM cairn_public.benchmark_vectors
       ${whereClause}`,
      values
    );

    const row = rows[0];
    if (!row || row.sample_size < BENCHMARK_MIN_SAMPLE || row.correlation === null) return null;

    return {
      metricA,
      metricB,
      correlation: Number(row.correlation),
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
