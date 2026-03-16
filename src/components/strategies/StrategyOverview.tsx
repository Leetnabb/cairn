import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { MATURITY_COLORS } from '../../types';

export function StrategyOverview() {
  const { t } = useTranslation();
  const strategies = useStore(s => s.strategies);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const setView = useStore(s => s.setView);

  const strategyData = useMemo(() => {
    return [...strategies]
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
      .map(s => {
        const linkedCaps = capabilities.filter(c => c.level === 1 && c.strategyIds?.includes(s.id));
        const allCapIds = new Set(linkedCaps.flatMap(c => [
          c.id,
          ...capabilities.filter(cc => cc.parent === c.id).map(cc => cc.id),
        ]));
        const linkedInits = initiatives.filter(i => i.capabilities.some(cid => allCapIds.has(cid)));
        const nearCount = linkedInits.filter(i => i.horizon === 'near').length;
        const farCount = linkedInits.filter(i => i.horizon === 'far').length;
        const capsProgressing = linkedCaps.filter(c => c.maturityTarget && c.maturityTarget > c.maturity).length;
        const coverageOk = linkedInits.length > 0 && linkedCaps.length > 0;

        return { s, linkedCaps, linkedInits, nearCount, farCount, capsProgressing, coverageOk };
      });
  }, [strategies, capabilities, initiatives]);

  const horizonColor: Record<string, string> = {
    short: '#22c55e',
    medium: '#f59e0b',
    long: '#6366f1',
  };

  if (strategies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-[13px] text-text-tertiary mb-2">{t('strategy.noStrategies')}</p>
          <p className="text-[11px] text-text-tertiary">{t('strategy.noStrategiesHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-[13px] font-semibold text-text-primary mb-4">{t('strategy.title')}</h2>
        <div className="space-y-3">
          {strategyData.map(({ s, linkedCaps, linkedInits, nearCount, farCount, capsProgressing, coverageOk }) => (
            <div
              key={s.id}
              className="bg-white rounded-lg border border-border p-4 hover:border-primary/40 transition-colors"
            >
              {/* Header row */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: s.priority === 1 ? '#ef4444' : s.priority === 2 ? '#f59e0b' : '#6b7280' }}
                  >
                    P{s.priority}
                  </span>
                  <button
                    onClick={() => setSelectedItem({ type: 'strategy', id: s.id })}
                    className="text-[14px] font-semibold text-text-primary hover:text-primary truncate text-left"
                  >
                    {s.name}
                  </button>
                </div>
                <span
                  className="shrink-0 px-2 py-0.5 rounded text-[9px] font-medium text-white"
                  style={{ backgroundColor: horizonColor[s.timeHorizon] }}
                >
                  {t(`strategy.${s.timeHorizon}`)}
                </span>
                {!coverageOk && (
                  <span className="shrink-0 text-[9px] text-amber-600 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    ⚠ {t('strategy.noLinkedCapabilities')}
                  </span>
                )}
              </div>

              {/* Description */}
              {s.description && (
                <p className="text-[11px] text-text-secondary mb-3">{s.description}</p>
              )}

              {/* Capability rows */}
              {linkedCaps.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {linkedCaps.map(cap => {
                    const allIds = new Set([cap.id, ...capabilities.filter(c => c.parent === cap.id).map(c => c.id)]);
                    const capInits = initiatives.filter(i => i.capabilities.some(cid => allIds.has(cid))).length;
                    const hasTarget = cap.maturityTarget && cap.maturityTarget > cap.maturity;
                    const gapFilled = hasTarget && capInits > 0;

                    return (
                      <button
                        key={cap.id}
                        onClick={() => setSelectedItem({ type: 'capability', id: cap.id })}
                        className="w-full flex items-center gap-3 px-2.5 py-1.5 rounded bg-gray-50 hover:bg-gray-100 border border-border/50 transition-colors text-left"
                      >
                        {/* Maturity bar */}
                        <div className="flex items-center gap-1 shrink-0">
                          {[1, 2, 3].map(level => (
                            <div
                              key={level}
                              className="w-3 h-3 rounded-sm"
                              style={{
                                backgroundColor: level <= cap.maturity
                                  ? MATURITY_COLORS[cap.maturity]
                                  : cap.maturityTarget && level <= cap.maturityTarget
                                  ? '#c7d2fe'
                                  : '#e5e7eb',
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-medium text-text-primary flex-1 truncate">{cap.name}</span>
                        {hasTarget && (
                          <span className="text-[9px] text-indigo-600 shrink-0">
                            {cap.maturity} → {cap.maturityTarget}
                          </span>
                        )}
                        <span className="text-[9px] text-text-tertiary shrink-0">{capInits} akt.</span>
                        {gapFilled && <span className="text-[9px] text-green-600 shrink-0">✓</span>}
                        {hasTarget && !gapFilled && <span className="text-[9px] text-amber-500 shrink-0">⚠</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer stats */}
              <div className="flex items-center gap-4 text-[9px] text-text-tertiary pt-2 border-t border-border/50">
                <span>{linkedInits.length} {t('dashboard.activities').toLowerCase()}</span>
                {nearCount > 0 && <span>{nearCount} {t('labels.horizon.near').toLowerCase()}</span>}
                {farCount > 0 && <span>{farCount} {t('labels.horizon.far').toLowerCase()}</span>}
                {capsProgressing > 0 && (
                  <span className="text-green-600">
                    ↑ {capsProgressing}/{linkedCaps.length} {t('strategy.capsProgressing')}
                  </span>
                )}
                <button
                  onClick={() => setView('roadmap')}
                  className="ml-auto text-primary hover:underline"
                >
                  {t('strategy.viewInPath')} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
