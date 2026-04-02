import { useMemo, useState } from 'react';
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

  // Split L1 into core and support
  const coreDomains = useMemo(
    () => l1.filter(c => c.capabilityType === 'core' || c.capabilityType === undefined),
    [l1]
  );
  const supportDomains = useMemo(
    () => l1.filter(c => c.capabilityType === 'support'),
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

    return (
      <div
        key={domain.id}
        draggable
        onDragStart={(e) => handleL1DragStart(e, domain.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          if (draggingId?.startsWith('l1:')) handleL1DragOver(e, domainIdx, section);
        }}
      >
        {isDomainDropTarget && (
          <div className="h-0.5 rounded mb-2 bg-primary" />
        )}
        <div
          className={`flex items-stretch border rounded shadow-card overflow-hidden transition-opacity duration-150 bg-card ${
            isSelected ? 'border-primary shadow-selected' : 'border-border'
          } ${draggingId === `l1:${domain.id}` ? 'opacity-50' : ''}`}
        >
          {/* Sticky domain name column */}
          <div
            className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-lane)] border-r border-border cursor-pointer shrink-0 w-[180px] min-w-[180px]"
            style={{ position: 'sticky', left: 0, zIndex: 10 }}
            onClick={() => setSelectedItem({ type: 'capability', id: domain.id })}
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: domainColor ?? '#94a3b8' }} />
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

    return (
      <div className={`rounded-lg ${bgClass} p-3 mb-4`}>
        {/* Section header */}
        <div className="flex items-center gap-2 mb-3 pl-1 border-l-[3px]"
          style={{ borderLeftColor: sectionKey === 'core' ? 'var(--color-primary, #6366f1)' : 'var(--border-default, #d1d5db)' }}
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

      {/* Core Value Streams section */}
      {renderSection(
        coreDomains,
        'core',
        'capLandscape.coreSection',
        'bg-[var(--bg-app)]',
      )}

      {/* Foundation & Support section */}
      {renderSection(
        supportDomains,
        'support',
        'capLandscape.supportSection',
        'bg-[var(--bg-lane)]',
      )}
    </div>
  );
}
