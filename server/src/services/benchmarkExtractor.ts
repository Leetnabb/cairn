import { createHash } from 'crypto';
import type { PlanTier } from '../types/index.js';

interface InitiativeState {
  id: string;
  horizon: 'near' | 'far';
  dimension: string;
  confidence: 'confirmed' | 'tentative' | 'under_consideration';
  capabilities?: string[];
  owner?: string;
}

interface CapabilityState {
  id: string;
  maturity?: number;
  risk?: number;
}

interface EffectState {
  id: string;
  type?: string;
  initiatives?: string[];
}

interface ScenarioState {
  initiatives?: InitiativeState[];
  capabilities?: CapabilityState[];
  effects?: EffectState[];
  criticalPathLength?: number;
  scenarioCount?: number;
}

export interface ExtractedBenchmarkVector {
  initiativeCount: number;
  capabilityCount: number;
  effectCount: number;
  nearHorizonPct: number;
  farHorizonPct: number;
  confirmedPct: number;
  tentativePct: number;
  underConsiderationPct: number;
  dimensionGini: number;
  capabilityCoverage: number | null;
  effectLinkage: number | null;
  criticalPathLength: number | null;
  initiativesPerDimension: Record<string, number>;
  avgCapabilityMaturity: number | null;
  avgCapabilityRisk: number | null;
  capabilitiesWithNoInitiatives: number;
  effectsWithNoInitiatives: number;
  initiativesWithNoEffects: number;
  maxOwnerLoad: number;
  scenarioCount: number | null;
  effectTypeDistribution: Record<string, number>;
  planTier: PlanTier;
}

// Canonical dimension keys mapped from Norwegian to English
const DIMENSION_MAP: Record<string, string> = {
  ledelse: 'leadership',
  virksomhet: 'business',
  organisasjon: 'organisation',
  teknologi: 'technology',
  // English keys pass through
  leadership: 'leadership',
  business: 'business',
  organisation: 'organisation',
  technology: 'technology',
};

/**
 * Extract a pure, text-free structural signal set from a scenario state.
 * Zero text fields — only numeric/categorical signals.
 * Returns null if insufficient data (< 3 initiatives).
 */
export function extractBenchmarkVector(
  state: Record<string, unknown>,
  planTier: PlanTier
): ExtractedBenchmarkVector | null {
  const scenarioState = state as ScenarioState;
  const initiatives = scenarioState.initiatives ?? [];

  if (initiatives.length < 3) return null;

  const total = initiatives.length;
  const near = initiatives.filter(i => i.horizon === 'near').length;
  const far = total - near;

  const confirmed = initiatives.filter(i => i.confidence === 'confirmed').length;
  const tentative = initiatives.filter(i => i.confidence === 'tentative').length;
  const underConsideration = initiatives.filter(i => i.confidence === 'under_consideration').length;

  // Dimension counts (mapped to canonical English keys)
  const dimCounts: Record<string, number> = {
    leadership: 0,
    business: 0,
    organisation: 0,
    technology: 0,
  };
  for (const initiative of initiatives) {
    const canonical = DIMENSION_MAP[initiative.dimension] ?? initiative.dimension;
    dimCounts[canonical] = (dimCounts[canonical] ?? 0) + 1;
  }
  const dimensionGini = computeGini(Object.values(dimCounts));

  // Capability analysis
  const capabilities = scenarioState.capabilities ?? [];
  const referencedCapIds = new Set(initiatives.flatMap(i => i.capabilities ?? []));
  let capabilityCoverage: number | null = null;
  let avgCapabilityMaturity: number | null = null;
  let avgCapabilityRisk: number | null = null;
  let capabilitiesWithNoInitiatives = 0;

  if (capabilities.length > 0) {
    capabilityCoverage = (referencedCapIds.size / capabilities.length) * 100;
    capabilitiesWithNoInitiatives = capabilities.filter(c => !referencedCapIds.has(c.id)).length;

    const maturities = capabilities.map(c => c.maturity).filter((m): m is number => m != null);
    if (maturities.length > 0) {
      avgCapabilityMaturity = maturities.reduce((s, v) => s + v, 0) / maturities.length;
    }

    const risks = capabilities.map(c => c.risk).filter((r): r is number => r != null);
    if (risks.length > 0) {
      avgCapabilityRisk = risks.reduce((s, v) => s + v, 0) / risks.length;
    }
  }

  // Effect analysis
  const effects = scenarioState.effects ?? [];
  let effectLinkage: number | null = null;
  let effectsWithNoInitiatives = 0;
  const effectTypeDistribution: Record<string, number> = {
    cost: 0,
    quality: 0,
    speed: 0,
    compliance: 0,
    strategic: 0,
  };

  if (effects.length > 0) {
    const linked = effects.filter(e => (e.initiatives ?? []).length > 0).length;
    effectLinkage = (linked / effects.length) * 100;
    effectsWithNoInitiatives = effects.filter(e => (e.initiatives ?? []).length === 0).length;

    for (const effect of effects) {
      const t = effect.type ?? 'strategic';
      effectTypeDistribution[t] = (effectTypeDistribution[t] ?? 0) + 1;
    }
  }

  // Initiatives with no effects
  const initIdsInEffects = new Set(effects.flatMap(e => e.initiatives ?? []));
  const initiativesWithNoEffects = initiatives.filter(i => !initIdsInEffects.has(i.id)).length;

  // Owner load
  const ownerCounts: Record<string, number> = {};
  for (const initiative of initiatives) {
    const owner = initiative.owner ?? '__unassigned__';
    ownerCounts[owner] = (ownerCounts[owner] ?? 0) + 1;
  }
  const maxOwnerLoad = Math.max(0, ...Object.values(ownerCounts));

  const criticalPathLength = scenarioState.criticalPathLength ?? null;
  const scenarioCount = scenarioState.scenarioCount ?? null;

  return {
    initiativeCount: total,
    capabilityCount: capabilities.length,
    effectCount: effects.length,
    nearHorizonPct: round2((near / total) * 100),
    farHorizonPct: round2((far / total) * 100),
    confirmedPct: round2((confirmed / total) * 100),
    tentativePct: round2((tentative / total) * 100),
    underConsiderationPct: round2((underConsideration / total) * 100),
    dimensionGini: round4(dimensionGini),
    capabilityCoverage: capabilityCoverage !== null ? round2(capabilityCoverage) : null,
    effectLinkage: effectLinkage !== null ? round2(effectLinkage) : null,
    criticalPathLength,
    initiativesPerDimension: dimCounts,
    avgCapabilityMaturity: avgCapabilityMaturity !== null ? round2(avgCapabilityMaturity) : null,
    avgCapabilityRisk: avgCapabilityRisk !== null ? round2(avgCapabilityRisk) : null,
    capabilitiesWithNoInitiatives,
    effectsWithNoInitiatives,
    initiativesWithNoEffects,
    maxOwnerLoad,
    scenarioCount,
    effectTypeDistribution,
    planTier,
  };
}

/**
 * Anonymise a tenant/snapshot ID for benchmark submission.
 * Uses SHA-256 with a server-side salt.
 */
export function anonymiseId(id: string): string {
  const salt = process.env.BENCHMARK_SALT ?? 'cairn-benchmark-salt-2024';
  return createHash('sha256').update(`${salt}:${id}`).digest('hex');
}

/**
 * Compute Gini coefficient (0 = equal, 1 = fully concentrated).
 */
export function computeGini(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;

  let sumOfAbsDiffs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumOfAbsDiffs += Math.abs(sorted[i] - sorted[j]);
    }
  }
  return sumOfAbsDiffs / (2 * n * total);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
