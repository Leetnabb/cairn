import { useTranslation } from 'react-i18next';
import type { Initiative, Capability, Effect } from '../../types';

interface Props {
  initiatives: Initiative[];
  capabilities: Capability[];
  effects: Effect[];
}

export function EffectFunnel({ initiatives, effects }: Props) {
  const { t } = useTranslation();

  // Count unique capabilities touched by initiatives
  const touchedCaps = new Set(initiatives.flatMap(i => i.capabilities));

  return (
    <div className="bg-card rounded border border-border p-3 mb-4">
      <h3 className="text-[11px] font-semibold mb-3">{t('dashboard.effectFunnel')}</h3>
      <div className="flex items-center justify-center gap-2">
        {/* Activities */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-14 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-[20px] font-bold text-primary">{initiatives.length}</span>
          </div>
          <span className="text-[9px] text-text-tertiary mt-1">{t('dashboard.activities')}</span>
        </div>

        {/* Arrow */}
        <svg width="32" height="16" viewBox="0 0 32 16" className="text-text-tertiary shrink-0">
          <path d="M0 8h24l-6-6M24 8l-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {/* Capability lifts */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-14 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
            <span className="text-[20px] font-bold text-green-700">{touchedCaps.size}</span>
          </div>
          <span className="text-[9px] text-text-tertiary mt-1 text-center">Kapabilitetsløft</span>
        </div>

        {/* Arrow */}
        <svg width="32" height="16" viewBox="0 0 32 16" className="text-text-tertiary shrink-0">
          <path d="M0 8h24l-6-6M24 8l-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {/* Effects */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-14 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center">
            <span className="text-[20px] font-bold text-yellow-700">{effects.length}</span>
          </div>
          <span className="text-[9px] text-text-tertiary mt-1">{t('effects.title')}</span>
        </div>
      </div>
    </div>
  );
}
