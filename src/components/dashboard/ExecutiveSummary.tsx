import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative, Capability, Effect, StrategicGoal } from '../../types';
import { DIMENSIONS } from '../../types';
import { computeInsights } from '../../lib/insights';
import { simulateMaturity } from '../../lib/simulation';

interface Props {
  initiatives: Initiative[];
  capabilities: Capability[];
  effects: Effect[];
  goals?: StrategicGoal[];
}

export function ExecutiveSummary({ initiatives, capabilities, effects, goals = [] }: Props) {
  const { t } = useTranslation();

  // Section 1: Portfolio scope
  const portfolioSentence = useMemo(() => {
    const dimCoverage = DIMENSIONS.filter(d => initiatives.some(i => i.dimension === d.key));
    const nearCount = initiatives.filter(i => i.horizon === 'near').length;
    const farCount = initiatives.filter(i => i.horizon === 'far').length;
    return `${initiatives.length} ${t('dashboard.activities').toLowerCase()} — ${nearCount} ${t('labels.horizon.near').toLowerCase()} / ${farCount} ${t('labels.horizon.far').toLowerCase()} — ${dimCoverage.length}/${DIMENSIONS.length} dim.`;
  }, [initiatives, t]);

  // Section 2: Maturity direction
  const maturitySentence = useMemo(() => {
    const simulated = simulateMaturity(capabilities, initiatives);
    const improved = simulated.filter(c => c.improved).length;
    if (improved === 0) return null;
    return `${improved}/${capabilities.length} kapabiliteter viser modenhetsløft.`;
  }, [capabilities, initiatives]);

  // Section 3: Top warnings
  const warnings = useMemo(() => {
    const insights = computeInsights(initiatives, capabilities, effects);
    return insights.filter(i => i.type === 'warning').slice(0, 2);
  }, [initiatives, capabilities, effects]);

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-4 mb-4">
      <h3 className="text-[11px] font-semibold text-primary uppercase mb-3">{t('dashboard.executiveSummary')}</h3>

      <div className="grid grid-cols-3 gap-4">
        {/* Section 1: Portfolio */}
        <div>
          <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
            {t('dashboard.activities')}
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed mb-2">{portfolioSentence}</p>
          {goals.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {goals.map(g => (
                <span
                  key={g.id}
                  className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Capability momentum */}
        <div>
          <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
            {t('dashboard.maturityJourney')}
          </div>
          {maturitySentence ? (
            <p className="text-[11px] text-text-secondary leading-relaxed">{maturitySentence}</p>
          ) : (
            <p className="text-[11px] text-text-tertiary italic">{t('common.none')}</p>
          )}
        </div>

        {/* Section 3: Risk / warnings */}
        <div>
          <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
            {t('dashboard.warnings')}
          </div>
          {warnings.length > 0 ? (
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 text-[10px] leading-tight shrink-0">⚠</span>
                  <span className="text-[10px] text-text-secondary leading-tight">{w.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-green-600 font-medium">✓ Ingen advarsler</p>
          )}
        </div>
      </div>
    </div>
  );
}
