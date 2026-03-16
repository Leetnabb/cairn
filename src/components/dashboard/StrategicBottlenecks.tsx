import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { MATURITY_COLORS, RISK_COLORS } from '../../types';

const MAX_PER_SECTION = 3;

export function StrategicBottlenecks() {
  const { t } = useTranslation();
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const setSelectedItem = useStore(s => s.setSelectedItem);

  const { underserviced, blocked, atRisk } = useMemo(() => {
    const l1Caps = capabilities.filter(c => c.level === 1);
    const initiativeMap = new Map(initiatives.map(i => [i.id, i]));

    // Section A: capabilities with fewer than 2 linked initiatives
    const underserviced = l1Caps
      .map(cap => {
        const childIds = capabilities.filter(c => c.parent === cap.id).map(c => c.id);
        const allIds = new Set([cap.id, ...childIds]);
        const count = initiatives.filter(i => i.capabilities.some(cid => allIds.has(cid))).length;
        return { cap, count };
      })
      .filter(({ count }) => count < 2)
      .sort((a, b) => a.count - b.count)
      .slice(0, MAX_PER_SECTION);

    // Section B: initiatives blocked by unstarted dependencies
    const blocked = initiatives
      .filter(i =>
        i.dependsOn.some(depId => {
          const dep = initiativeMap.get(depId);
          return dep && (dep.status === 'planned' || !dep.status);
        })
      )
      .map(i => ({
        init: i,
        blockers: i.dependsOn
          .map(depId => initiativeMap.get(depId))
          .filter(dep => dep && (dep.status === 'planned' || !dep.status)) as typeof initiatives,
      }))
      .slice(0, MAX_PER_SECTION);

    // Section C: high risk + low maturity
    const atRisk = l1Caps
      .filter(c => c.risk === 3 && c.maturity === 1)
      .slice(0, MAX_PER_SECTION);

    return { underserviced, blocked, atRisk };
  }, [capabilities, initiatives]);

  const totalIssues = underserviced.length + blocked.length + atRisk.length;

  if (totalIssues === 0) {
    return (
      <p className="text-[10px] text-green-600 font-medium">✓ {t('dashboard.noBottlenecks')}</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section A: Underserviced capabilities */}
      {underserviced.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
            {t('dashboard.bottleneckUnderserviced')}
          </div>
          <div className="space-y-1">
            {underserviced.map(({ cap, count }) => (
              <button
                key={cap.id}
                onClick={() => setSelectedItem({ type: 'capability', id: cap.id })}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
              >
                <span className="text-amber-500 text-[10px] shrink-0">⚠</span>
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
                  <span className="text-[10px] font-medium text-text-primary truncate">{cap.name}</span>
                </div>
                <span className="text-[9px] text-amber-700 shrink-0">
                  {count} {t('dashboard.activities').toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section B: Blocked initiatives */}
      {blocked.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
            {t('dashboard.bottleneckBlocked')}
          </div>
          <div className="space-y-1">
            {blocked.map(({ init, blockers }) => (
              <button
                key={init.id}
                onClick={() => setSelectedItem({ type: 'initiative', id: init.id })}
                className="w-full flex items-start gap-2 px-2 py-1.5 rounded border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left"
              >
                <span className="text-red-500 text-[10px] shrink-0 mt-px">🔴</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium text-text-primary truncate">{init.name}</div>
                  <div className="text-[8px] text-red-600 truncate">
                    ← {blockers.map(b => b.name).join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section C: High risk + low maturity */}
      {atRisk.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
            {t('dashboard.bottleneckHighRisk')}
          </div>
          <div className="space-y-1">
            {atRisk.map(cap => (
              <button
                key={cap.id}
                onClick={() => setSelectedItem({ type: 'capability', id: cap.id })}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left"
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
                <span className="text-[10px] font-medium text-text-primary flex-1 truncate">{cap.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RISK_COLORS[cap.risk] }} />
                  <span className="text-[8px] text-red-600">R:{cap.risk} M:{cap.maturity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
