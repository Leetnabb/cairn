import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { simulateMaturity } from '../../lib/simulation';
import { MATURITY_COLORS, RISK_COLORS } from '../../types';
import type { Capability } from '../../types';

export function CapabilityLandscape() {
  const { t } = useTranslation();
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const simulationEnabled = useStore(s => s.ui.simulationEnabled);
  const selectedItem = useStore(s => s.ui.selectedItem);
  const capabilityView = useStore(s => s.ui.capabilityView);
  const setCapabilityView = useStore(s => s.setCapabilityView);
  const setSelectedItem = useStore(s => s.setSelectedItem);

  const simulated = useMemo(() => {
    if (!simulationEnabled) return null;
    return simulateMaturity(capabilities, initiatives);
  }, [simulationEnabled, capabilities, initiatives]);

  const l1 = capabilities.filter(c => c.level === 1);
  const l2ByParent = useMemo(() => {
    const map: Record<string, Capability[]> = {};
    for (const c of capabilities) {
      if (c.level === 2 && c.parent) {
        if (!map[c.parent]) map[c.parent] = [];
        map[c.parent].push(c);
      }
    }
    return map;
  }, [capabilities]);

  // Count activities per capability
  const activityCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const init of initiatives) {
      for (const capId of init.capabilities) {
        counts[capId] = (counts[capId] || 0) + 1;
      }
    }
    return counts;
  }, [initiatives]);

  // Activity names per capability for tooltip
  const activityNames = useMemo(() => {
    const names: Record<string, string[]> = {};
    for (const init of initiatives) {
      for (const capId of init.capabilities) {
        if (!names[capId]) names[capId] = [];
        names[capId].push(init.name);
      }
    }
    return names;
  }, [initiatives]);

  const getSimData = (id: string) => {
    if (!simulated) return null;
    return simulated.find(c => c.id === id) ?? null;
  };

  const totalL2 = capabilities.filter(c => c.level === 2).length;
  const avgMaturity = capabilities.length > 0
    ? (capabilities.reduce((sum, c) => sum + c.maturity, 0) / capabilities.length).toFixed(1)
    : '0';

  const getIndicatorColor = (cap: Capability, simMat?: number) => {
    if (capabilityView === 'maturity') {
      return MATURITY_COLORS[simMat ?? cap.maturity];
    }
    return RISK_COLORS[cap.risk];
  };

  // Aggregate domain-level indicators
  const getDomainIndicator = (domainId: string) => {
    const children = l2ByParent[domainId] ?? [];
    const domain = capabilities.find(c => c.id === domainId);
    if (!domain) return null;

    const allCaps = [domain, ...children];
    if (capabilityView === 'maturity') {
      const avg = allCaps.reduce((s, c) => s + c.maturity, 0) / allCaps.length;
      const level = avg < 1.5 ? 1 : avg < 2.5 ? 2 : 3;
      return MATURITY_COLORS[level];
    } else {
      const maxRisk = Math.max(...allCaps.map(c => c.risk));
      return RISK_COLORS[maxRisk];
    }
  };

  return (
    <div className="h-full overflow-auto p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[14px] font-bold text-text-primary">{t('capLandscape.title')}</h1>
          <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
            <span>{l1.length} {t('capLandscape.domains')}</span>
            <span>&middot;</span>
            <span>{totalL2} {t('capLandscape.subCapabilities')}</span>
            <span>&middot;</span>
            <span>{t('capLandscape.avgMaturity')}: {avgMaturity}</span>
          </div>
        </div>
        <div className="flex gap-0.5">
          <button
            onClick={() => setCapabilityView('maturity')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              capabilityView === 'maturity' ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-gray-100'
            }`}
          >
            {t('labels.maturity.label')}
          </button>
          <button
            onClick={() => setCapabilityView('risk')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              capabilityView === 'risk' ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-gray-100'
            }`}
          >
            {t('labels.risk.label')}
          </button>
        </div>
      </div>

      {/* Domain grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {l1.map(domain => {
          const children = l2ByParent[domain.id] ?? [];
          const domainColor = getDomainIndicator(domain.id);
          const domainSim = getSimData(domain.id);
          const isSelected = selectedItem?.type === 'capability' && selectedItem.id === domain.id;

          return (
            <div
              key={domain.id}
              className={`bg-white border rounded shadow-card overflow-hidden ${
                isSelected ? 'border-primary shadow-selected' : 'border-border'
              }`}
            >
              {/* Domain header */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-border cursor-pointer"
                onClick={() => setSelectedItem({ type: 'capability', id: domain.id })}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: domainColor ?? '#94a3b8' }} />
                  <span className="text-[12px] font-semibold text-text-primary">{domain.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {activityCount[domain.id] > 0 && (
                    <span
                      className="text-[9px] bg-gray-200 text-text-secondary px-1.5 py-0.5 rounded-full"
                      title={activityNames[domain.id]?.join(', ')}
                    >
                      {activityCount[domain.id]}
                    </span>
                  )}
                  {domainSim?.improved && (
                    <span className="text-[9px] text-green-600 font-medium">
                      {domain.maturity} → {domainSim.simulatedMaturity}
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-capabilities */}
              <div className="p-2">
                {children.length === 0 ? (
                  <p className="text-[9px] text-text-tertiary italic px-1 py-2">{t('capLandscape.noSubCaps')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {children.map(child => {
                      const childSim = getSimData(child.id);
                      const isChildSelected = selectedItem?.type === 'capability' && selectedItem.id === child.id;
                      const indicatorColor = getIndicatorColor(child, childSim?.simulatedMaturity);
                      const count = activityCount[child.id] ?? 0;

                      return (
                        <div
                          key={child.id}
                          onClick={() => setSelectedItem({ type: 'capability', id: child.id })}
                          title={activityNames[child.id]?.join(', ')}
                          className={`px-2 py-1.5 rounded cursor-pointer border transition-all duration-150 ${
                            isChildSelected
                              ? 'border-primary shadow-selected'
                              : 'border-border bg-white hover:shadow-hover'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-medium leading-tight truncate">{child.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {count > 0 && (
                                <span className="text-[8px] bg-gray-100 text-text-tertiary px-1 py-0.5 rounded-full leading-none">
                                  {count}
                                </span>
                              )}
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicatorColor }} />
                              {childSim?.improved && (
                                <span className="text-[9px] text-green-600">▲</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
