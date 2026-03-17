import { createHash } from 'crypto';
import type { PlanTier } from '../types/index.js';

interface InitiativeState {
  id: string;
  horizon: 'near' | 'far';
  dimension: string;
  confidence: 'confirmed' | 'tentative' | 'under_consideration';
  capabilities?: string[];
}

interface CapabilityState {
  id: string;
}

interface EffectState {
  id: string;
  initiatives?: string[];
}

interface ScenarioState {
  initiatives?: InitiativeState[];
  capabilities?: CapabilityState[];
  effects?: EffectState[];
  criticalPathLength?: number;
}

export interface ExtractedBenchmarkVector {
  initiativeCount: number;
  nearHorizonPct: number;
  farHorizonPct: number;
  confirmedPct: number;
  tentativePct: number;
  underConsiderationPct: number;
  dimensionGini: number;
  capabilityCoverage: number | null;
  effectLinkage: number | null;
  criticalPathLength: number | null;
  planTier: PlanTier;
}

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

  // Dimension Gini coefficient (concentration index)
  const dimCounts: Record<string, number> = {};
  for (const initiative of initiatives) {
    dimCounts[initiative.dimension] = (dimCounts[initiative.dimension] ?? 0) + 1;
  }
  const dimensionGini = computeGini(Object.values(dimCounts));

  // Capability coverage
  let capabilityCoverage: number | null = null;
  const capabilities = scenarioState.capabilities ?? [];
  if (capabilities.length > 0) {
    const referenced = new Set(initiatives.flatMap(i => i.capabilities ?? []));
    capabilityCoverage = (referenced.size / capabilities.length) * 100;
  }

  // Effect linkage
  let effectLinkage: number | null = null;
  const effects = scenarioState.effects ?? [];
  if (effects.length > 0) {
    const linked = effects.filter(e => (e.initiatives ?? []).length > 0).length;
    effectLinkage = (linked / effects.length) * 100;
  }

  const criticalPathLength = scenarioState.criticalPathLength ?? null;

  return {
    initiativeCount: total,
    nearHorizonPct: round2((near / total) * 100),
    farHorizonPct: round2((far / total) * 100),
    confirmedPct: round2((confirmed / total) * 100),
    tentativePct: round2((tentative / total) * 100),
    underConsiderationPct: round2((underConsideration / total) * 100),
    dimensionGini: round4(dimensionGini),
    capabilityCoverage: capabilityCoverage !== null ? round2(capabilityCoverage) : null,
    effectLinkage: effectLinkage !== null ? round2(effectLinkage) : null,
    criticalPathLength,
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
function computeGini(values: number[]): number {
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
