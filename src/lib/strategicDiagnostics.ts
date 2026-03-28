import type { Initiative, StrategicFrame, Effect } from '../types';

export interface DiagnosticResult {
  type: 'unaddressed_theme' | 'unaligned_initiatives' | 'effect_at_risk' | 'absorption_warning';
  severity: 'warning' | 'info';
  themeName?: string;
  count?: number;
  message: string;
  details?: string;
}

/**
 * Simple word-overlap matching between an initiative name and a theme name/description.
 * Exported for reuse in narrativeEngine.ts.
 */
export function initiativeMatchesTheme(
  initiative: Initiative,
  theme: { name: string; description: string }
): boolean {
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
        message: `Strategisk tema "${theme.name}" har ingen initiativer som støtter det.`,
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
        message: `${unaligned.length} av ${initiatives.length} initiativer (${pct}%) kan ikke kobles til noen strategiske temaer.`,
        details: unaligned.map(i => i.name).join(', '),
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
      i.status === 'stopped' || i.status === 'changed_direction'
    );
    if (derailed.length > 0 && derailed.length >= linked.length * 0.5) {
      results.push({
        type: 'effect_at_risk',
        severity: 'warning',
        message: `Forventet effekt "${effect.name}" er truet: ${derailed.length} av ${linked.length} koblede initiativer er stoppet eller har endret retning.`,
      });
    }
  }
  return results;
}

export function detectAbsorptionIssues(initiatives: Initiative[]): DiagnosticResult[] {
  if (initiatives.length < 5) return [];
  const inProgress = initiatives.filter(i => i.status === 'in_progress').length;
  const done = initiatives.filter(i => i.status === 'done').length;
  const total = initiatives.length;

  if (inProgress >= 5 && (done === 0 || inProgress / Math.max(done, 1) > 3)) {
    return [{
      type: 'absorption_warning',
      severity: 'warning',
      count: inProgress,
      message: `${inProgress} av ${total} initiativer pågår, men bare ${done} er fullført. Organisasjonen kan ha kapasitetsproblemer.`,
    }];
  }
  return [];
}
