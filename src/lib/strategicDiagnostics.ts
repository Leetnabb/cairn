import type { Initiative, StrategicFrame } from '../types';

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
