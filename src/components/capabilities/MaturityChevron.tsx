import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MATURITY_COLORS, RISK_COLORS } from '../../types';
import type { Capability, Initiative } from '../../types';

interface Props {
  domain: Capability;
  children: Capability[];
  activityCount: Record<string, number>;
  activityNames: Record<string, string[]>;
  viewMode: 'maturity' | 'risk' | 'resource';
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  zoomLevel?: number;
  initiatives?: Initiative[];
  elevated?: boolean;
  registerChipRef?: (id: string, el: HTMLElement | null) => void;
  hoveredL2Id?: string | null;
  synergyTargets?: Set<string> | null;
  onL2Hover?: (id: string | null) => void;
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
  zoomLevel = 1,
  initiatives = [],
  elevated = false,
  registerChipRef,
  hoveredL2Id,
  synergyTargets,
  onL2Hover,
}: Props) {
  const { t } = useTranslation();
  const [hoveredGapStep, setHoveredGapStep] = useState<number | null>(null);
  const [hoveredResourceChip, setHoveredResourceChip] = useState<string | null>(null);

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

  const isHeatmap = zoomLevel <= 0.75;
  const isExpanded = zoomLevel >= 1.25;

  // Expanded zoom: linked initiative names per L2 cap
  const initiativeNamesForCap = useMemo(() => {
    if (!isExpanded) return {} as Record<string, string[]>;
    const map: Record<string, string[]> = {};
    for (const init of initiatives) {
      for (const capId of init.capabilities) {
        if (!map[capId]) map[capId] = [];
        map[capId].push(init.name);
      }
    }
    return map;
  }, [isExpanded, initiatives]);

  const currentMaturity = domain.maturity;
  const targetMaturity = domain.maturityTarget ?? currentMaturity;

  // Determine if a step is a strategic gap (only in maturity mode)
  const isStrategicGap = useCallback((step: number): boolean => {
    if (viewMode !== 'maturity') return false;
    if (!domain.maturityTarget) return false;
    if (step > domain.maturityTarget) return false;
    if (step <= currentMaturity) return false;
    // Check: no L2 children have maturity at this step level AND no L2 children placed in this step
    const hasChildAtLevel = children.some(c => c.maturity >= step);
    const hasChildInStep = childrenByStep[step]?.length > 0;
    return !hasChildAtLevel && !hasChildInStep;
  }, [viewMode, domain.maturityTarget, currentMaturity, children, childrenByStep]);

  // Compute aggregate resource load per step
  const stepResourceLoad = useMemo(() => {
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const step of STEPS) {
      const caps = childrenByStep[step].filter(c => c.resourceLoad !== undefined);
      if (caps.length > 0) {
        map[step] = caps.reduce((s, c) => s + (c.resourceLoad ?? 0), 0) / caps.length;
      }
    }
    return map;
  }, [childrenByStep]);

  const getResourceColor = (load: number) => {
    if (load > 0.9) return '#dc2626';
    if (load >= 0.7) return '#f59e0b';
    return '#64748b';
  };

  const getResourceBg = (load: number) => {
    if (load > 0.9) return 'rgba(220, 38, 38, 0.15)';
    if (load >= 0.7) return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(100, 116, 139, 0.15)';
  };

  const getStepStyle = (step: number) => {
    const colors = viewMode === 'maturity' ? MATURITY_COLORS : RISK_COLORS;

    if (viewMode === 'resource') {
      const load = stepResourceLoad[step];
      const hasCaps = childrenByStep[step].length > 0;
      return {
        backgroundColor: hasCaps ? getResourceBg(load) : 'var(--bg-lane)',
        borderColor: hasCaps ? getResourceColor(load) : 'var(--border-default)',
        opacity: hasCaps ? 1 : 0.5,
        variant: 'filled' as const,
      };
    }

    if (step <= currentMaturity) {
      // Completed / current: filled
      // elevated (core section): full opacity for all filled steps; standard: 0.6 for non-current
      const filledOpacity = elevated ? 1 : (step === currentMaturity ? 1 : 0.6);
      return {
        backgroundColor: colors[step],
        borderColor: colors[step],
        opacity: filledOpacity,
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
    if (viewMode === 'resource') {
      return getResourceColor(cap.resourceLoad ?? 0);
    }
    return RISK_COLORS[cap.risk];
  };

  // Callback ref for chip registration
  const chipRef = useCallback((id: string) => (el: HTMLElement | null) => {
    registerChipRef?.(id, el);
  }, [registerChipRef]);

  return (
    <div className="flex items-stretch gap-0 min-w-0 flex-1">
      {STEPS.map((step, idx) => {
        const style = getStepStyle(step);
        const capsInStep = childrenByStep[step];
        const initCount = initiativesByStep[step];
        const gap = isStrategicGap(step);
        const resourceLoad = stepResourceLoad[step];

        return (
          <div
            key={step}
            className={`flex-1 relative ${isHeatmap ? 'min-w-[40px]' : 'min-w-[120px]'}`}
            style={{ zIndex: 3 - idx }}
          >
            {/* Chevron shape via clip-path */}
            <div
              className={`h-full flex flex-col gap-1 ${isHeatmap ? 'min-h-[28px] px-1 py-1' : elevated ? 'min-h-[64px] px-3 py-2' : 'min-h-[56px] px-3 py-2'}`}
              style={{
                backgroundColor: viewMode === 'resource'
                  ? style.backgroundColor
                  : style.variant === 'filled' ? `${style.borderColor}${isHeatmap ? '60' : '10'}` : style.backgroundColor,
                borderWidth: gap ? '2px' : style.variant === 'target' ? '2px' : '1px',
                borderStyle: gap ? 'dashed' : style.variant === 'target' ? 'dashed' : 'solid',
                borderColor: gap ? '#f87171' : style.borderColor,
                borderRadius: idx === 0 ? '6px 0 0 6px' : idx === 2 ? '0 6px 6px 0' : '0',
                borderLeftWidth: idx === 0 ? (gap ? '2px' : '1px') : '0',
                opacity: style.opacity,
                animation: gap ? 'pulse-gap 2s ease-in-out infinite' : undefined,
                transition: 'opacity 200ms ease, background-color 200ms ease',
                clipPath: idx < 2
                  ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%' + (idx > 0 ? ', 12px 50%)' : ')')
                  : (idx > 0 ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)' : undefined),
              }}
            >
              {/* Heatmap mode: no text, no chips — just the colored block */}
              {!isHeatmap && (
                <>
                  {/* Step label */}
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[9px] uppercase tracking-wide ${elevated ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary'}`}>
                      {stepLabels[idx]}
                    </span>
                    <div className="flex items-center gap-1">
                      {viewMode === 'resource' && capsInStep.length > 0 && (
                        <span
                          className="text-[8px] font-medium px-1 py-0.5 rounded-full leading-none"
                          style={{
                            backgroundColor: getResourceBg(resourceLoad),
                            color: getResourceColor(resourceLoad),
                          }}
                        >
                          {Math.round(resourceLoad * 100)}%
                        </span>
                      )}
                      {initCount > 0 && viewMode !== 'resource' && (
                        <span className="text-[8px] bg-white/60 text-text-tertiary px-1 py-0.5 rounded-full leading-none">
                          {initCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Strategic Gap indicator with tooltip and click */}
                  {gap && capsInStep.length === 0 && (
                    <div
                      className="relative flex items-center gap-1 mt-1 cursor-pointer"
                      onMouseEnter={() => setHoveredGapStep(step)}
                      onMouseLeave={() => setHoveredGapStep(null)}
                      onClick={() => onSelectItem(domain.id)}
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="shrink-0">
                        <path d="M10 2L18 17H2L10 2Z" stroke="#f87171" strokeWidth="1.5" fill="#f8717120" />
                        <text x="10" y="14" textAnchor="middle" fontSize="10" fill="#f87171" fontWeight="bold">!</text>
                      </svg>
                      <span className="text-[8px] text-text-tertiary italic">
                        {t('maturityChevron.strategicGap')}
                      </span>
                      {/* Hover tooltip */}
                      {hoveredGapStep === step && (
                        <div
                          className="absolute left-0 bottom-full mb-1 z-30 bg-[var(--bg-app)] text-white text-[9px] px-2 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none"
                          style={{ minWidth: '180px' }}
                        >
                          <div>{t('maturityChevron.gapTooltip', { target: step })}</div>
                          <div className="text-text-tertiary mt-0.5">{domain.name}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* L2 chips */}
                  {capsInStep.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {capsInStep.map(child => {
                        const isSelected = selectedItemId === child.id;
                        const count = activityCount[child.id] ?? 0;
                        const color = getIndicatorColor(child);
                        const linkedNames = isExpanded ? (initiativeNamesForCap[child.id] ?? []) : [];

                        // Synergy styling
                        const isSynergySource = hoveredL2Id === child.id;
                        const isSynergyTarget = synergyTargets?.has(child.id) ?? false;
                        const isSynergyActive = hoveredL2Id !== null && synergyTargets !== null;
                        const isFadedBySynergy = isSynergyActive && !isSynergySource && !isSynergyTarget;

                        // Resource view chip background
                        const resourceChipBg = viewMode === 'resource' && child.resourceLoad !== undefined
                          ? getResourceBg(child.resourceLoad)
                          : undefined;

                        return (
                          <div key={child.id} className="relative">
                          <button
                            ref={chipRef(child.id)}
                            onClick={() => onSelectItem(child.id)}
                            onMouseEnter={() => { onL2Hover?.(child.id); if (viewMode === 'resource') setHoveredResourceChip(child.id); }}
                            onMouseLeave={() => { onL2Hover?.(null); setHoveredResourceChip(null); }}
                            title={activityNames[child.id]?.join(', ') || child.description}
                            className={`inline-flex flex-col gap-0.5 px-1.5 py-0.5 rounded text-[9px] border text-left ${
                              isSelected
                                ? 'border-primary shadow-selected bg-card'
                                : 'border-border/50 bg-card/80 hover:shadow-hover'
                            }`}
                            style={{
                              transition: 'all 200ms ease, background-color 200ms ease',
                              opacity: isFadedBySynergy ? 0.3 : 1,
                              transform: isSynergyTarget ? 'scale(1.05)' : undefined,
                              backgroundColor: resourceChipBg ?? undefined,
                              boxShadow: isSynergyTarget
                                ? '0 0 12px rgba(234, 179, 8, 0.4)'
                                : isSynergySource
                                  ? '0 0 8px rgba(234, 179, 8, 0.3)'
                                  : undefined,
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: color, transition: 'background-color 200ms ease' }}
                              />
                              <span className="truncate max-w-[80px]">{child.name}</span>
                              {viewMode === 'resource' && child.resourceLoad !== undefined && (
                                <span
                                  className="text-[7px] font-medium ml-0.5"
                                  style={{ color: getResourceColor(child.resourceLoad) }}
                                >
                                  {Math.round(child.resourceLoad * 100)}%
                                </span>
                              )}
                              {count > 0 && !isExpanded && viewMode !== 'resource' && (
                                <span className="text-[7px] bg-[var(--bg-hover)] text-text-tertiary px-0.5 rounded-full leading-none">
                                  {count}
                                </span>
                              )}
                              {/* Expanded: show risk dot alongside maturity dot */}
                              {isExpanded && viewMode !== 'resource' && (
                                <span className="text-[7px] text-text-tertiary ml-0.5">
                                  M{child.maturity} R{child.risk}
                                </span>
                              )}
                            </div>
                            {/* Expanded: show description */}
                            {isExpanded && child.description && (
                              <span className="text-[7px] text-text-tertiary leading-tight max-w-[120px] whitespace-normal line-clamp-2">
                                {child.description}
                              </span>
                            )}
                            {/* Expanded: show linked initiative names */}
                            {isExpanded && linkedNames.length > 0 && (
                              <div className="flex flex-wrap gap-0.5 mt-0.5">
                                {linkedNames.map(name => (
                                  <span key={name} className="text-[7px] bg-primary/10 text-primary px-1 rounded-full leading-none">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                          {/* Resource tooltip */}
                          {viewMode === 'resource' && hoveredResourceChip === child.id && child.resourceLoad !== undefined && (
                            <div
                              className="absolute left-0 bottom-full mb-1 z-30 bg-[var(--bg-app)] text-white text-[9px] px-2 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none"
                              style={{ minWidth: '160px' }}
                            >
                              {t('maturityChevron.resourceTooltip', {
                                load: Math.round(child.resourceLoad * 100),
                                effort: child.effortEstimate ?? '—',
                              })}
                            </div>
                          )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
