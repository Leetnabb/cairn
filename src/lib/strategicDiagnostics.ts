import type { Initiative, StrategicFrame, Effect } from '../types';
import { DIMENSIONS } from '../types';

export interface DiagnosticResult {
  type: 'unaddressed_theme' | 'unaligned_initiatives' | 'effect_at_risk' | 'absorption_warning' | 'unaddressed_goal';
  severity: 'warning' | 'info';
  themeName?: string;
  count?: number;
  message: string;
  details?: string;
}

/**
 * Check if an initiative is explicitly linked to a theme via themeIds.
 * Falls back to word-overlap matching for initiatives without themeIds (migration support).
 */
export function initiativeMatchesTheme(
  initiative: Initiative,
  theme: { id: string; name: string; description: string }
): boolean {
  // Prefer explicit link
  if (initiative.themeIds && initiative.themeIds.length > 0) {
    return initiative.themeIds.includes(theme.id);
  }
  // Fallback: word-overlap for unlinked initiatives
  const initWords = new Set(
    `${initiative.name} ${initiative.description}`.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  );
  const themeWords = `${theme.name} ${theme.description}`.toLowerCase().split(/\s+/)
    .filter(w => w.length > 3);
  return themeWords.some(w => {
    for (const iw of initWords) {
      if (iw.includes(w) || w.includes(iw)) return true;
    }
    return false;
  });
}

export function detectStrategicDrift(
  initiatives: Initiative[],
  frame: StrategicFrame | undefined
): DiagnosticResult[] {
  if (!frame || frame.themes.length === 0) return [];
  const results: DiagnosticResult[] = [];

  for (const theme of frame.themes) {
    const hasSupport = initiatives.some(i => initiativeMatchesTheme(i, theme));
    if (!hasSupport) {
      results.push({
        type: 'unaddressed_theme',
        severity: 'warning',
        themeName: theme.name,
        message: `Strategic theme "${theme.name}" has no supporting initiatives.`,
      });
    }
  }

  const unaligned = initiatives.filter(i =>
    !frame.themes.some(t => initiativeMatchesTheme(i, t))
  );
  if (unaligned.length > 0 && initiatives.length >= 3) {
    const pct = Math.round((unaligned.length / initiatives.length) * 100);
    if (pct > 30) {
      results.push({
        type: 'unaligned_initiatives',
        severity: 'warning',
        count: unaligned.length,
        message: `${unaligned.length} of ${initiatives.length} initiatives (${pct}%) cannot be linked to any strategic theme. This may indicate strategic drift — or an emergent direction worth acknowledging.`,
        details: unaligned.map(i => i.name).join(', '),
      });
    }
  }

  return results;
}

export function detectUnaddressedGoals(
  initiatives: Initiative[],
  frame: StrategicFrame | undefined
): DiagnosticResult[] {
  if (!frame || !frame.goals || frame.goals.length === 0) return [];
  const results: DiagnosticResult[] = [];

  for (const goal of frame.goals) {
    // A goal is addressed if any of its linked themes have initiatives
    const goalThemeIds = new Set(goal.themeIds);
    const hasActivity = initiatives.some(i =>
      i.themeIds?.some(tid => goalThemeIds.has(tid))
    );
    if (!hasActivity && goal.themeIds.length > 0) {
      results.push({
        type: 'unaddressed_goal',
        severity: 'warning',
        message: `Strategic goal "${goal.name}" has no active initiatives working toward it.`,
      });
    }
  }

  return results;
}

export function assessEffectFeasibility(
  initiatives: Initiative[],
  effects: Effect[]
): DiagnosticResult[] {
  if (effects.length === 0) return [];
  const results: DiagnosticResult[] = [];
  const initMap = new Map(initiatives.map(i => [i.id, i]));

  for (const effect of effects) {
    if (effect.initiatives.length === 0) continue;
    const linked = effect.initiatives
      .map(id => initMap.get(id))
      .filter((i): i is Initiative => i !== undefined);
    if (linked.length === 0) continue;

    const derailed = linked.filter(i =>
      i.status === 'stopped' || i.status === 'pivoted'
    );
    if (derailed.length > 0 && derailed.length >= linked.length * 0.5) {
      results.push({
        type: 'effect_at_risk',
        severity: 'warning',
        message: `Expected effect "${effect.name}" is at risk: ${derailed.length} of ${linked.length} linked initiatives are stopped or pivoted.`,
      });
    }
  }
  return results;
}

export function computeStrategicDiagnostics(
  initiatives: Initiative[],
  effects: Effect[],
  frame: StrategicFrame | undefined
): DiagnosticResult[] {
  // Diagnostics only run when a strategic frame is set
  if (!frame) return [];

  return [
    ...detectStrategicDrift(initiatives, frame),
    ...detectUnaddressedGoals(initiatives, frame),
    ...assessEffectFeasibility(initiatives, effects),
    ...detectAbsorptionIssues(initiatives),
    ...detectCrossDimensionGaps(initiatives),
  ];
}

export function detectCrossDimensionGaps(initiatives: Initiative[]): DiagnosticResult[] {
  const results: DiagnosticResult[] = [];
  const initMap = new Map(initiatives.map(i => [i.id, i]));

  const dimStats: Record<string, { own: number; inbound: number; sources: Set<string> }> = {};
  for (const dim of DIMENSIONS) {
    dimStats[dim.key] = { own: 0, inbound: 0, sources: new Set() };
  }

  for (const init of initiatives) {
    const isActive = init.status === 'active' || (!init.status && init.horizon === 'near');
    if (isActive) dimStats[init.dimension].own++;
  }

  for (const init of initiatives) {
    for (const depId of init.dependsOn) {
      const dep = initMap.get(depId);
      if (dep && dep.dimension !== init.dimension) {
        dimStats[dep.dimension].inbound++;
        dimStats[dep.dimension].sources.add(init.dimension);
      }
    }
  }

  for (const dim of DIMENSIONS) {
    const stats = dimStats[dim.key];
    if (stats.inbound >= 3 && stats.inbound > stats.own * 2) {
      results.push({
        type: 'absorption_warning',
        severity: 'warning',
        message: `${dim.label} has ${stats.own} own active initiatives, but ${stats.inbound} initiatives in other dimensions depend on it. Change work may become a bottleneck.`,
      });
    }
  }

  return results;
}

export function detectAbsorptionIssues(initiatives: Initiative[]): DiagnosticResult[] {
  if (initiatives.length < 5) return [];
  const inProgress = initiatives.filter(i => i.status === 'active').length;
  const done = initiatives.filter(i => i.status === 'done').length;
  const total = initiatives.length;

  if (inProgress >= 5 && (done === 0 || inProgress / Math.max(done, 1) > 3)) {
    return [{
      type: 'absorption_warning',
      severity: 'warning',
      count: inProgress,
      message: `${inProgress} of ${total} initiatives are active, but only ${done} are done. The organization may have capacity issues — consider whether you've taken on too much at once.`,
    }];
  }
  return [];
}
