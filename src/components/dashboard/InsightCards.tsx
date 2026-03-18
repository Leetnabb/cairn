import { useTranslation } from 'react-i18next';
import type { StrategicInsight } from '../../lib/strategicInsights';

interface Props {
  insights: StrategicInsight[];
  onInsightClick: (insight: StrategicInsight) => void;
}

const TYPE_BORDER_COLOR: Record<StrategicInsight['type'], string> = {
  imbalance: '#ef4444',
  blocker: '#eab308',
  gap: '#f59e0b',
  opportunity: '#22c55e',
};

export function InsightCards({ insights, onInsightClick }: Props) {
  const { t } = useTranslation();

  if (insights.length === 0) {
    return (
      <div className="mb-4 px-3 py-2 bg-slate-800 rounded border border-slate-700 text-sm text-slate-400 italic">
        {t('dashboard.noInsights', 'Ingen strategiske innsikter å vise')}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      {insights.map(insight => (
        <button
          key={insight.id}
          onClick={() => onInsightClick(insight)}
          className="flex-1 flex items-stretch text-left bg-slate-800 rounded border border-slate-700 hover:brightness-110 transition-all duration-150 overflow-hidden focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          {/* Colored left border indicator */}
          <div
            className="w-1 shrink-0"
            style={{ backgroundColor: TYPE_BORDER_COLOR[insight.type] }}
          />
          <div className="flex-1 px-3 py-3">
            <p className="text-sm font-medium text-white leading-snug mb-1">
              {insight.message}
            </p>
            {insight.detail && (
              <p className="text-xs text-slate-400 leading-relaxed">
                {insight.detail}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
