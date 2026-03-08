import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative, Capability, Effect } from '../../types';
import { DIMENSIONS } from '../../types';
import { computeInsights } from '../../lib/insights';
import { simulateMaturity } from '../../lib/simulation';

interface Props {
  initiatives: Initiative[];
  capabilities: Capability[];
  effects: Effect[];
}

export function ExecutiveSummary({ initiatives, capabilities, effects }: Props) {
  const { t } = useTranslation();

  const summary = useMemo(() => {
    const sentences: string[] = [];

    // Portfolio scope
    const dimCoverage = DIMENSIONS.filter(d => initiatives.some(i => i.dimension === d.key));
    const nearCount = initiatives.filter(i => i.horizon === 'near').length;
    const farCount = initiatives.filter(i => i.horizon === 'far').length;
    sentences.push(
      `${initiatives.length} ${t('dashboard.activities').toLowerCase()} ${t('export.activitiesCount', { total: initiatives.length, near: nearCount, far: farCount })} — ${dimCoverage.length}/${DIMENSIONS.length} ${t('labels.dimensions.ledelse').toLowerCase().includes('led') ? 'dimensjoner dekket' : 'dimensions covered'}.`
    );

    // Maturity direction
    const simulated = simulateMaturity(capabilities, initiatives);
    const improved = simulated.filter(c => c.improved).length;
    if (improved > 0) {
      sentences.push(
        `${improved} ${capabilities.length > 0 ? `av ${capabilities.length}` : ''} kapabiliteter viser modenhetsløft ved gjennomføring.`
      );
    }

    // Top risk
    const insights = computeInsights(initiatives, capabilities, effects);
    const warnings = insights.filter(i => i.type === 'warning');
    if (warnings.length > 0) {
      sentences.push(`${warnings.length} advarsel${warnings.length > 1 ? 'er' : ''}: ${warnings[0].message}`);
    }

    return sentences;
  }, [initiatives, capabilities, effects, t]);

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-4 mb-4">
      <h3 className="text-[11px] font-semibold text-primary uppercase mb-2">{t('dashboard.executiveSummary')}</h3>
      <div className="space-y-1">
        {summary.map((s, i) => (
          <p key={i} className="text-[11px] text-text-secondary leading-relaxed">{s}</p>
        ))}
      </div>
    </div>
  );
}
