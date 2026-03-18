import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { MATURITY_COLORS } from '../../types';
import { InitiativeBox } from './InitiativeBox';

export function CapabilityPath() {
  const { t } = useTranslation();
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const criticalPathEnabled = useStore(s => s.ui.criticalPathEnabled);

  const strategies = useStore(s => s.strategies);

  const l1Caps = useMemo(
    () => capabilities.filter(c => c.level === 1).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [capabilities]
  );

  // For each L1 cap, get initiatives linked to it or its L2 children
  const capRows = useMemo(() => {
    return l1Caps.map(cap => {
      const childIds = capabilities.filter(c => c.parent === cap.id).map(c => c.id);
      const allIds = new Set([cap.id, ...childIds]);
      const linked = initiatives.filter(i => i.capabilities.some(cid => allIds.has(cid)));
      const capStrategies = strategies.filter(s => cap.strategyIds?.includes(s.id));
      return {
        cap,
        near: linked.filter(i => i.horizon === 'near').sort((a, b) => a.order - b.order),
        far: linked.filter(i => i.horizon === 'far').sort((a, b) => a.order - b.order),
        capStrategies,
      };
    });
  }, [l1Caps, capabilities, initiatives, strategies]);

  // Unlinked initiatives (no capabilities)
  const unlinked = useMemo(
    () => initiatives.filter(i => i.capabilities.length === 0),
    [initiatives]
  );

  if (l1Caps.length === 0) {
    return (
      <div className="p-6 text-center text-[11px] text-text-tertiary italic">
        {t('strategyPath.noCaps')}
      </div>
    );
  }

  const gridCols = '160px 1fr 1fr';

  return (
    <div className="min-h-full p-3">
      {/* Column headers */}
      <div className="grid mb-2" style={{ gridTemplateColumns: gridCols, gap: '4px' }}>
        <div />
        <div className="text-[10px] font-semibold text-text-secondary text-center px-2">
          {t('labels.horizon.nearRange')}
        </div>
        <div className="text-[10px] font-semibold text-text-secondary text-center px-2 opacity-70">
          {t('labels.horizon.farRange')}
        </div>
      </div>

      {/* Capability rows */}
      {capRows.map(({ cap, near, far, capStrategies }) => (
        <div key={cap.id} className="grid mb-1" style={{ gridTemplateColumns: gridCols, gap: '4px' }}>
          {/* Capability label */}
          <button
            onClick={() => setSelectedItem({ type: 'capability', id: cap.id })}
            className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50 border border-border text-left hover:bg-gray-100 transition-colors"
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-text-primary truncate">{cap.name}</div>
              {cap.maturityTarget && cap.maturityTarget !== cap.maturity && (
                <div className="text-[8px] text-text-tertiary">
                  {cap.maturity} → <span className="text-indigo-500">{cap.maturityTarget}</span>
                </div>
              )}
              {capStrategies.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {capStrategies.slice(0, 2).map(s => (
                    <span
                      key={s.id}
                      className="px-1 py-px text-[7px] rounded bg-indigo-100 text-indigo-700 leading-tight truncate max-w-[70px]"
                      title={s.name}
                    >
                      {s.name}
                    </span>
                  ))}
                  {capStrategies.length > 2 && (
                    <span className="text-[7px] text-text-tertiary">+{capStrategies.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </button>

          {/* Near column */}
          <div
            className="relative rounded min-h-[48px] p-1.5 flex flex-wrap gap-1 content-start"
            style={{ backgroundColor: '#f8f9ff', borderLeft: '3px solid #6366f1' }}
          >
            {near.map(i => (
              <InitiativeBox key={i.id} initiative={i} criticalPathEnabled={criticalPathEnabled} />
            ))}
            {near.length === 0 && (
              <span className="text-[9px] text-text-tertiary italic self-center ml-1">{t('common.none')}</span>
            )}
          </div>

          {/* Far column */}
          <div
            className="relative rounded min-h-[48px] p-1.5 flex flex-wrap gap-1 content-start opacity-70"
            style={{ backgroundColor: '#f0f4ff' }}
          >
            {far.map(i => (
              <InitiativeBox key={i.id} initiative={i} criticalPathEnabled={criticalPathEnabled} />
            ))}
            {far.length === 0 && (
              <span className="text-[9px] text-text-tertiary italic self-center ml-1">{t('common.none')}</span>
            )}
          </div>
        </div>
      ))}

      {/* Unlinked row */}
      {unlinked.length > 0 && (
        <div className="grid mt-2" style={{ gridTemplateColumns: gridCols, gap: '4px' }}>
          <div className="flex items-center px-2 py-1.5 rounded bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-semibold text-amber-700 truncate">
              ⚠ {t('strategyPath.unlinked')}
            </span>
          </div>
          <div
            className="rounded min-h-[48px] p-1.5 flex flex-wrap gap-1 content-start col-span-2"
            style={{ backgroundColor: '#fffbeb', borderLeft: '3px solid #f59e0b' }}
          >
            {unlinked.map(i => (
              <InitiativeBox key={i.id} initiative={i} criticalPathEnabled={criticalPathEnabled} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
