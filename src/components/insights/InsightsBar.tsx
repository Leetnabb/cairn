import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { computeInsights } from '../../lib/insights';
import i18n from '../../i18n';

export function InsightsBar() {
  const { t } = useTranslation();
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);
  const strategicFrame = useStore(s => s.strategicFrame);
  const expanded = useStore(s => s.ui.insightsExpanded);
  const setInsightsExpanded = useStore(s => s.setInsightsExpanded);

  const insights = useMemo(() => computeInsights(initiatives, capabilities, effects, strategicFrame), [initiatives, capabilities, effects, strategicFrame, i18n.language]);

  if (insights.length === 0) return null;

  const colors = {
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    positive: 'bg-green-50 text-green-800 border-green-200',
  };

  const icons = { warning: '\u26a0', info: '\u2139', positive: '\u2713' };
  const warnings = insights.filter(i => i.type === 'warning');

  return (
    <div className="px-4 py-1 bg-gray-50 border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setInsightsExpanded(!expanded)}
          className="text-[10px] text-text-secondary hover:text-text-primary flex items-center gap-1"
        >
          <span>{expanded ? '\u25be' : '\u25b8'}</span>
          <span className="font-medium">{t('insights.title')}</span>
          {warnings.length > 0 && (
            <span className="px-1 py-0 text-[8px] rounded-full bg-yellow-100 text-yellow-700">{t('insights.warningCount', { count: warnings.length })}</span>
          )}
        </button>
        {!expanded && insights.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto">
            {insights.slice(0, 3).map((insight, idx) => (
              <span key={idx} className={`px-1.5 py-0.5 text-[9px] rounded border shrink-0 ${colors[insight.type]}`}>
                {icons[insight.type]} {insight.message}
              </span>
            ))}
            {insights.length > 3 && <span className="text-[9px] text-text-tertiary">{t('insights.more', { count: insights.length - 3 })}</span>}
          </div>
        )}
      </div>
      {expanded && (
        <div className="mt-1 space-y-0.5 pb-1">
          {insights.map((insight, idx) => (
            <div key={idx} className={`px-2 py-1 text-[10px] rounded border ${colors[insight.type]}`}>
              {icons[insight.type]} {insight.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
