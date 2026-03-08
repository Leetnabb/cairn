import { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { computeInsights } from '../../lib/insights';
import i18n from '../../i18n';

export function InsightsBadge() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);

  const insights = useMemo(() => computeInsights(initiatives, capabilities, effects), [initiatives, capabilities, effects, i18n.language]);
  const warnings = insights.filter(i => i.type === 'warning');

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (insights.length === 0) return null;

  const colors = {
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    positive: 'bg-green-50 text-green-800 border-green-200',
  };
  const icons = { warning: '\u26a0', info: '\u2139', positive: '\u2713' };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-7 h-7 flex items-center justify-center text-text-secondary hover:bg-gray-100 rounded transition-colors"
        title={t('header.warnings')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {warnings.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-yellow-500 text-white text-[7px] font-bold px-0.5">
            {warnings.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg py-2 w-[320px] max-h-[400px] overflow-y-auto z-50">
          <div className="px-3 pb-1.5 text-[10px] font-semibold text-text-secondary uppercase">
            {t('insights.title')}
          </div>
          <div className="space-y-0.5 px-2">
            {insights.map((insight, idx) => (
              <div key={idx} className={`px-2 py-1.5 text-[10px] rounded border ${colors[insight.type]}`}>
                {icons[insight.type]} {insight.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
