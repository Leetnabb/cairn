import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { simulateMaturity } from '../../lib/simulation';
import { MATURITY_COLORS, RISK_COLORS } from '../../types';
import type { Capability } from '../../types';
import { MaturityChevron } from './MaturityChevron';

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
  const zoomLevel = useStore(s => s.ui.filters.zoomLevel ?? 1);
  const setFilter = useStore(s => s.setFilter);

  // Hovered L1 domain id for cross-domain dependency highlighting
  const [hoveredCapId, setHoveredCapId] = useState<string | null>(null);

  // Drag state for L1 domain reordering
  const [dropDomainIndex, setDropDomainIndex] = useState<number | null>(null);
  // Drag state for L2 capability reordering: key = domainId, value = drop index within that domain
  const [dropL2, setDropL2] = useState<{ domainId: string; index: number } | null>(null);
  // Track what is being dragged: 'l1:id' or 'l2:id'
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // Track which section is being dragged into for L1
  const [dropSection, setDropSection] = useState<'core' | 'support' | null>(null);

  const simulated = useMemo(() => {
    if (!simulationEnabled) return null;
    return simulateMaturity(capabilities, initiatives);
  }, [simulationEnabled, capabilities, initiatives]);

  const l1 = useMemo(
    () => [...capabilities.filter(c => c.level === 1)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [capabilities]
  );

  // Split L1 into core and support, sorted by priorityWeight desc then order asc
  const coreDomains = useMemo(
    () => l1
      .filter(c => c.capabilityType === 'core' || c.capabilityType === undefined)
      .sort((a, b) => {
        const pw = (b.priorityWeight ?? 0) - (a.priorityWeight ?? 0);
        return pw !== 0 ? pw : (a.order ?? 0) - (b.order ?? 0);
      }),
    [l1]
  );
  const supportDomains = useMemo(
    () => l1
      .filter(c => c.capabilityType === 'support')
      .sort((a, b) => {
        const pw = (b.priorityWeight ?? 0) - (a.priorityWeight ?? 0);
        return pw !== 0 ? pw : (a.order ?? 0) - (b.order ?? 0);
      }),
    [l1]
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

  // --- Semantic zoom ---
  const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const stepZoom = useCallback((direction: 'in' | 'out') => {
    const currentIdx = ZOOM_STEPS.findIndex(s => s >= zoomLevel);
    const idx = direction === 'in'
      ? Math.min((currentIdx === -1 ? ZOOM_STEPS.length - 1 : currentIdx) + 1, ZOOM_STEPS.length - 1)
      : Math.max((currentIdx === -1 ? 0 : currentIdx) - 1, 0);
    setFilter({ zoomLevel: ZOOM_STEPS[idx] });
  }, [zoomLevel, setFilter]);

  const landscapeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        stepZoom(e.deltaY < 0 ? 'in' : 'out');
      }
    };
    const el = landscapeRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [stepZoom]);

  // Derived zoom tiers
  const isHeatmap = zoomLevel <= 0.75;
  const isExpanded = zoomLevel >= 1.25;

  // --- Cross-domain dependency highlighting ---
  // For each L1 domain, collect all L2 cap ids under it (including itself)
  const capIdsForDomain = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const domain of l1) {
      const children = l2ByParent[domain.id] ?? [];
      map[domain.id] = new Set([domain.id, ...children.map(c => c.id)]);
    }
    return map;
  }, [l1, l2ByParent]);

  // For each L1 domain, collect initiative ids linked to it
  const initiativeIdsForDomain = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const domain of l1) {
      map[domain.id] = new Set<string>();
      const capIds = capIdsForDomain[domain.id];
      for (const init of initiatives) {
        if (init.capabilities.some(c => capIds.has(c))) {
          map[domain.id].add(init.id);
        }
      }
    }
    return map;
  }, [l1, capIdsForDomain, initiatives]);

  // Build initiative id -> dependsOn map
  const initDepsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const init of initiatives) map.set(init.id, init.dependsOn);
    return map;
  }, [initiatives]);

  // When hovering an L1 domain, find all connected L1 domains (shared initiatives or dep-linked)
  const connectedDomainIds = useMemo((): Set<string> | null => {
    if (!hoveredCapId) return null;
    const hoveredInitIds = initiativeIdsForDomain[hoveredCapId] ?? new Set<string>();
    const connected = new Set<string>();

    for (const domain of l1) {
      if (domain.id === hoveredCapId) continue;
      const domainInitIds = initiativeIdsForDomain[domain.id] ?? new Set<string>();

      // Direct shared initiatives
      for (const initId of hoveredInitIds) {
        if (domainInitIds.has(initId)) {
          connected.add(domain.id);
          break;
        }
      }

      // Dependency-linked: hovered domain's initiatives depend on this domain's initiatives
      for (const initId of hoveredInitIds) {
        const deps = initDepsMap.get(initId) ?? [];
        if (deps.some(d => domainInitIds.has(d))) {
          connected.add(domain.id);
          break;
        }
      }

      // Dependency-linked: this domain's initiatives depend on hovered domain's initiatives
      for (const initId of domainInitIds) {
        const deps = initDepsMap.get(initId) ?? [];
        if (deps.some(d => hoveredInitIds.has(d))) {
          connected.add(domain.id);
          break;
        }
      }
    }
    return connected;
  }, [hoveredCapId, l1, initiativeIdsForDomain, initDepsMap]);

  const getSimData = (id: string) => {
    if (!simulated) return null;
    return simulated.find(c => c.id === id) ?? null;
  };

  const totalL2 = capabilities.filter(c => c.level === 2).length;
  const avgMaturity = capabilities.length > 0
    ? (capabilities.reduce((sum, c) => sum + c.maturity, 0) / capabilities.length).toFixed(1)
    : '0';

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

  const handleL1DragOver = (e: React.DragEvent, idx: number, section: 'core' | 'support') => {
    if (!draggingId?.startsWith('l1:')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropDomainIndex(idx);
    setDropSection(section);
  };

  const handleL1Drop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data?.startsWith('l1:') && dropDomainIndex !== null) {
      moveCapability(data.slice(3), null, dropDomainIndex);
    }
    setDropDomainIndex(null);
    setDraggingId(null);
    setDropSection(null);
  };

  const handleGridDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropDomainIndex(null);
      setDropSection(null);
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
    setDropSection(null);
  };

  const renderDomainRow = (domain: Capability, domainIdx: number, section: 'core' | 'support') => {
    const children = l2ByParent[domain.id] ?? [];
    const domainColor = getDomainIndicator(domain.id);
    const domainSim = getSimData(domain.id);
    const isSelected = selectedItem?.type === 'capability' && selectedItem.id === domain.id;
    const isDomainDropTarget = dropDomainIndex === domainIdx && dropSection === section && draggingId?.startsWith('l1:');

    // Cross-domain highlight state
    const isHovered = hoveredCapId === domain.id;
    const isConnected = connectedDomainIds ? connectedDomainIds.has(domain.id) : false;
    const isFaded = hoveredCapId !== null && !isHovered && !isConnected;

    return (
      <div
        key={domain.id}
        draggable
        onDragStart={(e) => handleL1DragStart(e, domain.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          if (draggingId?.startsWith('l1:')) handleL1DragOver(e, domainIdx, section);
        }}
        onMouseEnter={() => setHoveredCapId(domain.id)}
        onMouseLeave={() => setHoveredCapId(null)}
      >
        {isDomainDropTarget && (
          <div className="h-0.5 rounded mb-2 bg-primary" />
        )}
        <div
          className={`flex items-stretch border rounded shadow-card overflow-hidden bg-card ${
            isSelected ? 'border-primary shadow-selected' : isConnected ? 'border-primary/60' : 'border-border'
          } ${draggingId === `l1:${domain.id}` ? 'opacity-50' : ''}`}
          style={{
            transition: 'opacity 150ms ease, box-shadow 150ms ease',
            opacity: isFaded ? 0.35 : 1,
            boxShadow: isConnected ? '0 0 0 2px var(--color-primary, #6366f1)33' : undefined,
          }}
        >
          {/* Sticky domain name column */}
          <div
            className={`flex items-center gap-2 bg-[var(--bg-lane)] border-r border-border cursor-pointer shrink-0 ${isHeatmap ? 'px-2 py-1 w-[120px] min-w-[120px]' : 'px-3 py-2 w-[180px] min-w-[180px]'}`}
            style={{ position: 'sticky', left: 0, zIndex: 10 }}
            onClick={() => setSelectedItem({ type: 'capability', id: domain.id })}
          >
            <div className={`rounded-full shrink-0 ${isHeatmap ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} style={{ backgroundColor: domainColor ?? '#94a3b8' }} />
            {!isHeatmap && (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-text-primary truncate">{domain.name}</span>
                <div className="flex items-center gap-1">
                  {activityCount[domain.id] > 0 && (
                    <span
                      className="text-[8px] bg-gray-200 text-text-secondary px-1 py-0.5 rounded-full"
                      title={activityNames[domain.id]?.join(', ')}
                    >
                      {activityCount[domain.id]}
                    </span>
                  )}
                  {domainSim?.improved && (
                    <span className="text-[8px] text-green-600 font-medium">
                      {domain.maturity} → {domainSim.simulatedMaturity}
                    </span>
                  )}
                </div>
              </div>
            )}
            {isHeatmap && (
              <span className="text-[9px] font-medium text-text-secondary truncate">{domain.name}</span>
            )}
          </div>

          {/* Maturity chevron with L2 children */}
          <div
            className="flex-1 min-w-0 transition-colors duration-150"
            style={{
              backgroundColor: dropL2?.domainId === domain.id ? '#f0f4ff' : 'transparent',
            }}
            onDragOver={(e) => handleL2DragOver(e, domain.id, children.length)}
            onDrop={(e) => handleL2Drop(e, domain.id)}
            onDragLeave={(e) => handleL2DragLeave(e, domain.id)}
          >
            {children.length === 0 && !(dropL2?.domainId === domain.id) ? (
              <div className="flex items-center h-full px-3">
                <p className="text-[9px] text-text-tertiary italic">{t('capLandscape.noSubCaps')}</p>
              </div>
            ) : (
              <div className="p-1">
                <MaturityChevron
                  domain={domain}
                  children={children}
                  activityCount={activityCount}
                  activityNames={activityNames}
                  viewMode={capabilityView}
                  selectedItemId={selectedItem?.type === 'capability' ? selectedItem.id : null}
                  onSelectItem={(id) => setSelectedItem({ type: 'capability', id })}
                  zoomLevel={zoomLevel}
                  initiatives={initiatives}
                  elevated={section === 'core'}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (
    domains: Capability[],
    sectionKey: 'core' | 'support',
    titleKey: string,
    bgClass: string,
  ) => {
    if (domains.length === 0 && l1.length > 0) return null;

    const isCore = sectionKey === 'core';

    return (
      <div
        className={`rounded-lg ${bgClass} p-3 mb-4`}
        style={isCore
          ? { boxShadow: '0 2px 6px -1px rgba(0,0,0,0.08)' }
          : { boxShadow: 'inset 0 4px 6px -4px rgba(0,0,0,0.06)' }
        }
      >
        {/* Sticky section header */}
        <div
          className="flex items-center gap-2 mb-3 pl-1 border-l-[3px] bg-inherit"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 15,
            borderLeftColor: isCore ? 'var(--color-primary, #6366f1)' : 'var(--border-default, #d1d5db)',
          }}
        >
          <h2 className="text-[12px] font-semibold text-text-primary">
            {t(titleKey)}
          </h2>
          <span className="text-[10px] text-text-tertiary">
            {domains.length} {t('capLandscape.domains')}
          </span>
        </div>

        {/* Domain rows */}
        <div
          className="flex flex-col gap-2"
          onDragOver={(e) => {
            if (draggingId?.startsWith('l1:')) {
              e.preventDefault();
              handleL1DragOver(e, domains.length, sectionKey);
            }
          }}
          onDrop={handleL1Drop}
          onDragLeave={handleGridDragLeave}
        >
          {domains.map((domain, idx) => renderDomainRow(domain, idx, sectionKey))}
          {dropDomainIndex === domains.length && dropSection === sectionKey && draggingId?.startsWith('l1:') && (
            <div className="h-0.5 rounded bg-primary" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={landscapeRef} className="h-full overflow-auto p-4">
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
              capabilityView === 'maturity' ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-[var(--bg-hover)]'
            }`}
          >
            {t('labels.maturity.label')}
          </button>
          <button
            onClick={() => setCapabilityView('risk')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              capabilityView === 'risk' ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-[var(--bg-hover)]'
            }`}
          >
            {t('labels.risk.label')}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {l1.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[12px] text-text-tertiary">{t('capLandscape.emptyDomains')}</p>
        </div>
      )}

      {/* Core Business & Value Creation section */}
      {renderSection(
        coreDomains,
        'core',
        'capLandscape.coreSection',
        'bg-[var(--bg-app)]',
      )}

      {/* Divider: "STRATEGISK FUNDAMENT" */}
      {coreDomains.length > 0 && supportDomains.length > 0 && (
        <div className="flex items-center gap-3 py-3 px-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
            {t('capLandscape.strategicFoundation')}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* Support & Foundation section */}
      {renderSection(
        supportDomains,
        'support',
        'capLandscape.supportSection',
        'bg-[var(--bg-lane)]',
      )}

      {/* Zoom indicator */}
      {zoomLevel !== 1 && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-md px-3 py-1.5 text-[11px] text-text-secondary shadow-md z-20">
          {t('zoom.indicator', { level: Math.round(zoomLevel * 100) })}
        </div>
      )}
    </div>
  );
}
