import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative, Capability, Effect } from '../../types';
import { computeInsights } from '../../lib/insights';

interface Props {
  initiatives: Initiative[];
  capabilities: Capability[];
  effects: Effect[];
}

export function ActionableWarnings({ initiatives, capabilities, effects }: Props) {
  const { t } = useTranslation();

  const actionItems = useMemo(() => {
    const insights = computeInsights(initiatives, capabilities, effects);
    return insights
      .filter(i => i.type === 'warning')
      .slice(0, 5)
      .map(insight => {
        // Transform factual insights into actionable suggestions
        if (insight.message.includes('kapasitetsrisiko') || insight.message.includes('capacity risk')) {
          return { ...insight, message: insight.message.replace(/—.*$/, '— vurder omfordeling av ansvar') };
        }
        if (insight.message.includes('avhenger av') || insight.message.includes('depends on')) {
          return { ...insight, message: insight.message + ' — vurder resekvensering' };
        }
        return insight;
      });
  }, [initiatives, capabilities, effects]);

  if (actionItems.length === 0) {
    return <p className="text-[10px] text-text-tertiary italic">{t('common.none')}</p>;
  }

  return (
    <div className="space-y-1">
      {actionItems.map((item, idx) => (
        <div key={idx} className="px-2 py-1.5 rounded bg-yellow-50 border border-yellow-200 text-[10px] text-yellow-800">
          {item.message}
        </div>
      ))}
    </div>
  );
}
