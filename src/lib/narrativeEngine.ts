import type { Initiative, Capability, Effect } from '../types';
import { DIMENSIONS } from '../types';
import { getMergedCriticalPath } from './criticalPath';
import { initiativeMatchesTheme } from './strategicDiagnostics';
import type { StrategicFrame } from '../types';

export interface NarrativeSignal {
  priority: number;
  text: string;
}

/**
 * Benchmark context passed from the UI when available (ENTERPRISE plan + authenticated).
 * Contains pre-fetched percentile data for key metrics.
 */
export interface BenchmarkContext {
  initiativeCount?: { percentile: number; sampleSize: number };
  dimensionGini?: { percentile: number; sampleSize: number };
  capabilityCoverage?: { percentile: number; sampleSize: number };
  criticalPathLength?: { percentile: number; sampleSize: number };
  distribution?: {
    initiativeCount?: { p25: number; p50: number; p75: number; mean: number };
  };
}

function dimensionSignal(initiatives: Initiative[]): NarrativeSignal | null {
  if (initiatives.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const dim of DIMENSIONS) counts[dim.key] = 0;
  for (const i of initiatives) counts[i.dimension] = (counts[i.dimension] || 0) + 1;

  const total = initiatives.length;
  const domDim = DIMENSIONS.reduce((a, b) => counts[a.key] > counts[b.key] ? a : b);
  const emptyDims = DIMENSIONS.filter(d => counts[d.key] === 0);

  if (emptyDims.length > 0) {
    const names = emptyDims.map(d => d.label).join(' and ');
    const pct = Math.round((counts[domDim.key] / total) * 100);
    return {
      priority: 1,
      text: `${domDim.label} accounts for ${pct}% of all initiatives (${counts[domDim.key]} of ${total}). ${names} ${emptyDims.length > 1 ? 'have' : 'has'} no planned initiatives — a common risk when capability building requires cross-domain coordination.`,
    };
  }

  if (counts[domDim.key] / total > 0.4) {
    const pct = Math.round((counts[domDim.key] / total) * 100);
    return {
      priority: 1,
      text: `The strategy is heavily weighted toward ${domDim.label} (${counts[domDim.key]} of ${total} initiatives, ${pct}%). Consider whether other dimensions are receiving adequate investment.`,
    };
  }

  return null;
}

function capabilitySignal(initiatives: Initiative[], capabilities: Capability[]): NarrativeSignal | null {
  const referenced = new Set(initiatives.flatMap(i => i.capabilities));
  const uncovered = capabilities.filter(c => !referenced.has(c.id));
  if (uncovered.length === 0) return null;

  const lowMaturity = uncovered.filter(c => c.maturity === 1);
  if (lowMaturity.length > 0) {
    return {
      priority: 2,
      text: `${uncovered.length} ${uncovered.length === 1 ? 'capability has' : 'capabilities have'} no supporting initiatives. Of these, ${lowMaturity.length} ${lowMaturity.length === 1 ? 'is' : 'are'} currently at low maturity — they will not improve without deliberate investment.`,
    };
  }

  return {
    priority: 2,
    text: `${uncovered.length} ${uncovered.length === 1 ? 'capability has' : 'capabilities have'} no supporting initiatives. Verify this is intentional before the next planning cycle.`,
  };
}

function effectSignal(initiatives: Initiative[], effects: Effect[]): NarrativeSignal | null {
  if (effects.length === 0) return null;

  const initIdsWithEffects = new Set(effects.flatMap(e => e.initiatives));
  const unlinkedEffects = effects.filter(e => e.initiatives.length === 0);
  const unlinkedInits = initiatives.filter(i => !initIdsWithEffects.has(i.id));

  if (unlinkedEffects.length > 0 && unlinkedInits.length > 0) {
    return {
      priority: 3,
      text: `${unlinkedEffects.length} ${unlinkedEffects.length === 1 ? 'effect is' : 'effects are'} not supported by any initiative. The strategy does not currently explain how these outcomes will be achieved.`,
    };
  }

  if (unlinkedEffects.length > 0) {
    return {
      priority: 3,
      text: `${unlinkedEffects.length} ${unlinkedEffects.length === 1 ? 'effect has' : 'effects have'} no linked initiatives. The connection between planned work and expected outcomes is incomplete.`,
    };
  }

  return null;
}

function horizonSignal(initiatives: Initiative[]): NarrativeSignal | null {
  if (initiatives.length < 3) return null;

  const near = initiatives.filter(i => i.horizon === 'near').length;
  const far = initiatives.filter(i => i.horizon === 'far').length;
  const total = initiatives.length;

  if (far > near) {
    return {
      priority: 4,
      text: `Far-horizon initiatives outnumber near-horizon ones (${far} vs ${near}). Verify that the near-term execution path is clear and adequately resourced.`,
    };
  }

  if (total > 0 && near / total > 0.8) {
    return {
      priority: 4,
      text: `Most work is concentrated in the near horizon (${near} of ${total} initiatives). The far horizon is underdeveloped — consider whether long-term capability building is adequately planned.`,
    };
  }

  return null;
}

function criticalPathSignal(initiatives: Initiative[]): NarrativeSignal | null {
  if (initiatives.length < 2) return null;

  const { merged } = getMergedCriticalPath(initiatives);
  if (merged.size < 2) return null;

  const pathIds = Array.from(merged);
  const first = initiatives.find(i => i.id === pathIds[0]);
  const last = initiatives.find(i => i.id === pathIds[pathIds.length - 1]);

  if (!first || !last || first.id === last.id) return null;

  return {
    priority: 5,
    text: `The critical path runs from "${first.name}" to "${last.name}" — a sequence of ${merged.size} initiatives that must complete before strategic effects are realised.`,
  };
}

function confidenceSignal(initiatives: Initiative[]): NarrativeSignal | null {
  const near = initiatives.filter(i => i.horizon === 'near');
  if (near.length < 3) return null;

  const uncertain = near.filter(i =>
    i.confidence === 'tentative' || i.confidence === 'under_consideration'
  );

  if (uncertain.length / near.length > 0.3) {
    const pct = Math.round((uncertain.length / near.length) * 100);
    return {
      priority: 6,
      text: `${pct}% of near-horizon initiatives are not yet confirmed. The strategy carries significant execution uncertainty.`,
    };
  }

  return null;
}

/**
 * Generate benchmark-contextualised signals using pre-fetched percentile data.
 * Returns null if no benchmark context is provided or data is insufficient.
 */
function benchmarkSignal(
  initiatives: Initiative[],
  benchmark?: BenchmarkContext
): NarrativeSignal | null {
  if (!benchmark) return null;

  const total = initiatives.length;

  // Initiative count vs. benchmark
  if (benchmark.initiativeCount && benchmark.distribution?.initiativeCount) {
    const { percentile } = benchmark.initiativeCount;
    const { p50 } = benchmark.distribution.initiativeCount;
    const median = Math.round(p50);

    if (percentile >= 75) {
      return {
        priority: 0,
        text: `Your strategy path has ${total} initiatives — above the median of ${median} for similar organisations (${percentile}th percentile). This is associated with higher execution risk in the benchmark.`,
      };
    }

    if (percentile <= 25) {
      return {
        priority: 0,
        text: `Your strategy path has ${total} initiatives — below the median of ${median} for similar organisations (${percentile}th percentile). Consider whether additional initiatives are needed to address strategic goals.`,
      };
    }
  }

  // Dimension concentration vs. benchmark
  if (benchmark.dimensionGini) {
    const { percentile } = benchmark.dimensionGini;
    if (percentile >= 80) {
      return {
        priority: 0,
        text: `Your initiative distribution across dimensions is more concentrated than ${percentile}% of comparable organisations. Diversifying across dimensions may reduce execution risk.`,
      };
    }
  }

  // Capability coverage vs. benchmark
  if (benchmark.capabilityCoverage) {
    const { percentile } = benchmark.capabilityCoverage;
    if (percentile <= 20) {
      return {
        priority: 0,
        text: `Your capability coverage (initiatives linked to capabilities) is lower than ${100 - percentile}% of comparable organisations. Consider linking more initiatives to capabilities for clearer strategic alignment.`,
      };
    }
  }

  return null;
}

function strategicFrameSignal(
  initiatives: Initiative[],
  frame?: StrategicFrame
): NarrativeSignal | null {
  if (!frame || frame.themes.length === 0 || initiatives.length < 3) return null;

  const aligned = initiatives.filter(i =>
    frame.themes.some(t => initiativeMatchesTheme(i, t))
  );
  const pct = Math.round((aligned.length / initiatives.length) * 100);

  if (pct < 50) {
    return {
      priority: 0,
      text: `Only ${pct}% of initiatives align with the stated strategic themes. The organization may be drifting from its intended direction — or an emergent strategy is forming that the frame doesn't yet reflect.`,
    };
  }
  return null;
}

export function generateNarrative(
  initiatives: Initiative[],
  capabilities: Capability[],
  effects: Effect[],
  benchmark?: BenchmarkContext,
  frame?: StrategicFrame
): string {
  if (initiatives.length === 0) {
    return 'No initiatives have been added yet. Add initiatives to the strategy path to generate a strategic reading.';
  }

  const signals: NarrativeSignal[] = [
    strategicFrameSignal(initiatives, frame),
    benchmarkSignal(initiatives, benchmark),
    dimensionSignal(initiatives),
    capabilitySignal(initiatives, capabilities),
    effectSignal(initiatives, effects),
    horizonSignal(initiatives),
    criticalPathSignal(initiatives),
    confidenceSignal(initiatives),
  ]
    .filter((s): s is NarrativeSignal => s !== null)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2);

  if (signals.length === 0) {
    const total = initiatives.length;
    const near = initiatives.filter(i => i.horizon === 'near').length;
    const far = total - near;
    return `The strategy path contains ${total} initiatives across ${new Set(initiatives.map(i => i.dimension)).size} dimensions — ${near} in the near horizon, ${far} in the far horizon. No critical signals detected.`;
  }

  return signals.map(s => s.text).join(' ');
}
