import { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { computeStrategicInsights } from '../../lib/strategicInsights';
import type { StrategicInsight } from '../../lib/strategicInsights';

const TYPE_COLORS: Record<StrategicInsight['type'], string> = {
  imbalance: 'border-l-red-500',
  blocker: 'border-l-yellow-500',
  gap: 'border-l-amber-500',
  opportunity: 'border-l-green-500',
};

export function InsightsBadge() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);
  const setSelectedItem = useStore(s => s.setSelectedItem);

  const insights = useMemo(
    () => computeStrategicInsights(initiatives, capabilities, effects),
    [initiatives, capabilities, effects],
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (insights.length === 0) return null;

  function handleInsightClick(insight: StrategicInsight) {
    if (insight.relatedIds.length > 0) {
      const id = insight.relatedIds[0];
      const isCapability = insight.type === 'blocker' && insight.id === 'unlinked-capabilities';
      setSelectedItem({ type: isCapability ? 'capability' : 'initiative', id });
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-7 h-7 flex items-center justify-center text-text-secondary hover:bg-gray-100 rounded transition-colors"
        title={t('header.warnings')}
        aria-label={t('header.warnings')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-slate-500 text-white text-[7px] font-bold px-0.5">
          {insights.length}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg py-2 w-[340px] z-50">
          <div className="px-3 pb-1.5 text-[10px] font-semibold text-text-secondary uppercase">
            {t('insights.title')}
          </div>
          <div className="space-y-1 px-2">
            {insights.map((insight) => (
              <button
                key={insight.id}
                onClick={() => handleInsightClick(insight)}
                className={`w-full text-left px-3 py-2 text-[11px] rounded border border-slate-100 border-l-[3px] ${TYPE_COLORS[insight.type]} bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-700 leading-snug">{insight.message}</span>
                  <span className="text-slate-400 group-hover:text-slate-600 shrink-0 mt-0.5">→</span>
                </div>
                {insight.detail && (
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{insight.detail}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
