import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MATURITY_COLORS, RISK_COLORS } from '../../types';
import type { Capability } from '../../types';

interface Props {
  domain: Capability;
  children: Capability[];
  activityCount: Record<string, number>;
  activityNames: Record<string, string[]>;
  viewMode: 'maturity' | 'risk';
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}

const STEPS = [1, 2, 3] as const;

export function MaturityChevron({
  domain,
  children,
  activityCount,
  activityNames,
  viewMode,
  selectedItemId,
  onSelectItem,
}: Props) {
  const { t } = useTranslation();

  const stepLabels = [
    t('maturityChevron.establish'),
    t('maturityChevron.optimize'),
    t('maturityChevron.innovate'),
  ];

  // Group L2 capabilities by their maturity level
  const childrenByStep = useMemo(() => {
    const map: Record<number, Capability[]> = { 1: [], 2: [], 3: [] };
    for (const child of children) {
      map[child.maturity].push(child);
    }
    return map;
  }, [children]);

  // Count initiatives per step (sum of L2 initiatives in that maturity bucket)
  const initiativesByStep = useMemo(() => {
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const step of STEPS) {
      for (const child of childrenByStep[step]) {
        map[step] += activityCount[child.id] ?? 0;
      }
    }
    return map;
  }, [childrenByStep, activityCount]);

  const currentMaturity = domain.maturity;
  const targetMaturity = domain.maturityTarget ?? currentMaturity;

  const getStepStyle = (step: number) => {
    const colors = viewMode === 'maturity' ? MATURITY_COLORS : RISK_COLORS;

    if (step <= currentMaturity) {
      // Completed / current: filled
      return {
        backgroundColor: colors[step],
        borderColor: colors[step],
        opacity: step === currentMaturity ? 1 : 0.6,
        variant: 'filled' as const,
      };
    }
    if (step <= targetMaturity) {
      // Target: dashed outline
      return {
        backgroundColor: 'transparent',
        borderColor: colors[step],
        opacity: 1,
        variant: 'target' as const,
      };
    }
    // Future: empty/gray
    return {
      backgroundColor: 'var(--bg-lane)',
      borderColor: 'var(--border-default)',
      opacity: 0.5,
      variant: 'empty' as const,
    };
  };

  const getIndicatorColor = (cap: Capability) => {
    if (viewMode === 'maturity') {
      return MATURITY_COLORS[cap.maturity];
    }
    return RISK_COLORS[cap.risk];
  };

  return (
    <div className="flex items-stretch gap-0 min-w-0 flex-1">
      {STEPS.map((step, idx) => {
        const style = getStepStyle(step);
        const capsInStep = childrenByStep[step];
        const initCount = initiativesByStep[step];

        return (
          <div
            key={step}
            className="flex-1 min-w-[120px] relative"
            style={{ zIndex: 3 - idx }}
          >
            {/* Chevron shape via clip-path */}
            <div
              className="h-full min-h-[56px] px-3 py-2 flex flex-col gap-1"
              style={{
                backgroundColor: style.variant === 'filled' ? `${style.borderColor}10` : style.backgroundColor,
                borderWidth: style.variant === 'target' ? '2px' : '1px',
                borderStyle: style.variant === 'target' ? 'dashed' : 'solid',
                borderColor: style.borderColor,
                borderRadius: idx === 0 ? '6px 0 0 6px' : idx === 2 ? '0 6px 6px 0' : '0',
                borderLeftWidth: idx === 0 ? '1px' : '0',
                opacity: style.opacity,
                clipPath: idx < 2
                  ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%' + (idx > 0 ? ', 12px 50%)' : ')')
                  : (idx > 0 ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)' : undefined),
              }}
            >
              {/* Step label */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-semibold text-text-secondary uppercase tracking-wide">
                  {stepLabels[idx]}
                </span>
                {initCount > 0 && (
                  <span className="text-[8px] bg-white/60 text-text-tertiary px-1 py-0.5 rounded-full leading-none">
                    {initCount}
                  </span>
                )}
              </div>

              {/* L2 chips */}
              {capsInStep.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {capsInStep.map(child => {
                    const isSelected = selectedItemId === child.id;
                    const count = activityCount[child.id] ?? 0;
                    const color = getIndicatorColor(child);

                    return (
                      <button
                        key={child.id}
                        onClick={() => onSelectItem(child.id)}
                        title={activityNames[child.id]?.join(', ') || child.description}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border transition-all ${
                          isSelected
                            ? 'border-primary shadow-selected bg-white'
                            : 'border-border/50 bg-white/80 hover:shadow-hover'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate max-w-[80px]">{child.name}</span>
                        {count > 0 && (
                          <span className="text-[7px] bg-[var(--bg-hover)] text-text-tertiary px-0.5 rounded-full leading-none">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
