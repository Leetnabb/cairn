import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Capability, Initiative } from '../../types';
import { MATURITY_COLORS } from '../../types';
import { simulateMaturity } from '../../lib/simulation';

interface Props {
  capabilities: Capability[];
  initiatives: Initiative[];
}

export function MaturityJourney({ capabilities, initiatives }: Props) {
  const { t } = useTranslation();

  const simulated = useMemo(() => simulateMaturity(capabilities, initiatives), [capabilities, initiatives]);
  const l1 = simulated.filter(c => c.level === 1);

  if (l1.length === 0) return <p className="text-[10px] text-text-tertiary italic">{t('common.none')}</p>;

  return (
    <div className="space-y-1.5">
      {l1.map(cap => (
        <div key={cap.id} className="flex items-center gap-2">
          <span className="text-[10px] w-28 truncate shrink-0 text-text-secondary">{cap.name}</span>
          <div className="flex items-center gap-1 flex-1">
            {/* Current maturity */}
            <div className="flex items-center gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
              <span className="text-[9px] text-text-tertiary">{cap.maturity}</span>
            </div>
            {/* Arrow */}
            {cap.improved && (
              <>
                <div className="flex-1 h-px bg-gray-300 min-w-[20px]" />
                <svg width="8" height="8" viewBox="0 0 8 8" className="text-green-500 shrink-0">
                  <path d="M0 4h6l-2-2M6 4l-2 2" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
                <div className="flex items-center gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.simulatedMaturity] }} />
                  <span className="text-[9px] font-medium text-green-600">{cap.simulatedMaturity}</span>
                </div>
              </>
            )}
            {!cap.improved && (
              <span className="text-[8px] text-text-tertiary ml-1">-</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
