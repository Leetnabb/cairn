import { useMemo, useState } from 'react';
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
  const moveCapability = useStore(s => s.moveCapability);

  // Drag state for L1 domain reordering
  const [dropDomainIndex, setDropDomainIndex] = useState<number | null>(null);
  // Drag state for L2 capability reordering: key = domainId, value = drop index within that domain
  const [dropL2, setDropL2] = useState<{ domainId: string; index: number } | null>(null);
  // Track what is being dragged: 'l1:id' or 'l2:id'
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const simulated = useMemo(() => {
    if (!simulationEnabled) return null;
    return simulateMaturity(capabilities, initiatives);
  }, [simulationEnabled, capabilities, initiatives]);

  const l1 = useMemo(
    () => [...capabilities.filter(c => c.level === 1)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [capabilities]
  );

  const l2ByParent = useMemo(() => {
    const map: Record<string, Capability[]> = {};
    for (const c of capabilities) {
      if (c.level === 2 && c.parent) {
        if (!map[c.parent]) map[c.parent] = [];
        map[c.parent].push(c);
      }
    }
    // Sort each group by order
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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

  // --- L1 drag handlers ---
  const handleL1DragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', `l1:${id}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(`l1:${id}`);
  };

  const handleL1DragOver = (e: React.DragEvent, idx: number) => {
    if (!draggingId?.startsWith('l1:')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropDomainIndex(idx);
  };

  const handleL1Drop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data?.startsWith('l1:') && dropDomainIndex !== null) {
      moveCapability(data.slice(3), null, dropDomainIndex);
    }
    setDropDomainIndex(null);
    setDraggingId(null);
  };

  const handleGridDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropDomainIndex(null);
    }
  };

  // --- L2 drag handlers ---
  const handleL2DragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', `l2:${id}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(`l2:${id}`);
  };

  const handleL2DragOver = (e: React.DragEvent, domainId: string, idx: number) => {
    if (!draggingId?.startsWith('l2:')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropL2({ domainId, index: idx });
  };

  const handleL2Drop = (e: React.DragEvent, domainId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData('text/plain');
    if (data?.startsWith('l2:') && dropL2 !== null) {
      moveCapability(data.slice(3), domainId, dropL2.index);
    }
    setDropL2(null);
    setDraggingId(null);
  };

  const handleL2DragLeave = (e: React.DragEvent, domainId: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dropL2?.domainId === domainId) setDropL2(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropDomainIndex(null);
    setDropL2(null);
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        onDragOver={(e) => {
          if (draggingId?.startsWith('l1:')) {
            e.preventDefault();
            handleL1DragOver(e, l1.length);
          }
        }}
        onDrop={handleL1Drop}
        onDragLeave={handleGridDragLeave}
      >
        {l1.map((domain, domainIdx) => {
          const children = l2ByParent[domain.id] ?? [];
          const domainColor = getDomainIndicator(domain.id);
          const domainSim = getSimData(domain.id);
          const isSelected = selectedItem?.type === 'capability' && selectedItem.id === domain.id;
          const isDomainDropTarget = dropDomainIndex === domainIdx && draggingId?.startsWith('l1:');

          return (
            <div
              key={domain.id}
              draggable
              onDragStart={(e) => handleL1DragStart(e, domain.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => {
                if (draggingId?.startsWith('l1:')) handleL1DragOver(e, domainIdx);
              }}
            >
              {isDomainDropTarget && (
                <div className="h-0.5 rounded mb-2 bg-primary" />
              )}
              <div
                className={`bg-white border rounded shadow-card overflow-hidden transition-opacity duration-150 ${
                  isSelected ? 'border-primary shadow-selected' : 'border-border'
                } ${draggingId === `l1:${domain.id}` ? 'opacity-50' : ''}`}
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
                <div
                  className="p-2 min-h-[40px] transition-colors duration-150"
                  style={{
                    backgroundColor: dropL2?.domainId === domain.id ? '#f0f4ff' : 'transparent',
                  }}
                  onDragOver={(e) => handleL2DragOver(e, domain.id, children.length)}
                  onDrop={(e) => handleL2Drop(e, domain.id)}
                  onDragLeave={(e) => handleL2DragLeave(e, domain.id)}
                >
                  {children.length === 0 && !(dropL2?.domainId === domain.id) ? (
                    <p className="text-[9px] text-text-tertiary italic px-1 py-2">{t('capLandscape.noSubCaps')}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {children.map((child, childIdx) => {
                        const childSim = getSimData(child.id);
                        const isChildSelected = selectedItem?.type === 'capability' && selectedItem.id === child.id;
                        const indicatorColor = getIndicatorColor(child, childSim?.simulatedMaturity);
                        const count = activityCount[child.id] ?? 0;
                        const isDropTarget =
                          dropL2?.domainId === domain.id && dropL2.index === childIdx;

                        return (
                          <div
                            key={child.id}
                            onDragOver={(e) => handleL2DragOver(e, domain.id, childIdx)}
                          >
                            {isDropTarget && (
                              <div className="h-0.5 rounded mb-1 bg-primary" />
                            )}
                            <div
                              draggable
                              onDragStart={(e) => handleL2DragStart(e, child.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() => setSelectedItem({ type: 'capability', id: child.id })}
                              title={activityNames[child.id]?.join(', ')}
                              className={`px-2 py-1.5 rounded cursor-pointer border transition-all duration-150 ${
                                isChildSelected
                                  ? 'border-primary shadow-selected'
                                  : 'border-border bg-white hover:shadow-hover'
                              } ${draggingId === `l2:${child.id}` ? 'opacity-50' : ''}`}
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
                          </div>
                        );
                      })}
                      {dropL2?.domainId === domain.id && dropL2.index === children.length && (
                        <div className="col-span-2 h-0.5 rounded bg-primary" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {dropDomainIndex === l1.length && draggingId?.startsWith('l1:') && (
          <div className="h-0.5 rounded col-span-full bg-primary" />
        )}
      </div>
    </div>
  );
}
