import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { CapabilityCard } from './CapabilityCard';
import { simulateMaturity } from '../../lib/simulation';

export function CapabilityMap() {
  const { t } = useTranslation();
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const simulationEnabled = useStore(s => s.ui.simulationEnabled);
  const selectedItem = useStore(s => s.ui.selectedItem);
  const [capabilityView, setCapabilityView] = useState<'maturity' | 'risk'>('maturity');

  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  const simulated = useMemo(() => {
    if (!simulationEnabled) return null;
    return simulateMaturity(capabilities, initiatives);
  }, [simulationEnabled, capabilities, initiatives]);

  const l1 = capabilities.filter(c => c.level === 1);
  const l2ByParent = useMemo(() => {
    const map: Record<string, typeof capabilities> = {};
    for (const c of capabilities) {
      if (c.level === 2 && c.parent) {
        if (!map[c.parent]) map[c.parent] = [];
        map[c.parent].push(c);
      }
    }
    return map;
  }, [capabilities]);

  // Highlight capabilities related to selected initiative
  const highlightedIds = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'initiative') return new Set<string>();
    const init = initiatives.find(i => i.id === selectedItem.id);
    return new Set(init?.capabilities ?? []);
  }, [selectedItem, initiatives]);

  const toggleExpand = (id: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSimData = (id: string) => {
    if (!simulated) return {};
    const s = simulated.find(c => c.id === id);
    return s ? { simulatedMaturity: s.simulatedMaturity, improved: s.improved } : {};
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[12px] font-semibold text-text-primary">{t('detail.capabilities')}</h2>
        <div className="flex gap-0.5">
          <button
            onClick={() => setCapabilityView('maturity')}
            className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
              capabilityView === 'maturity' ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-[var(--bg-hover)]'
            }`}
          >
            {t('labels.maturity.label')}
          </button>
          <button
            onClick={() => setCapabilityView('risk')}
            className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
              capabilityView === 'risk' ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-[var(--bg-hover)]'
            }`}
          >
            {t('labels.risk.label')}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {l1.map(cap => {
          const children = l2ByParent[cap.id] ?? [];
          const isExpanded = expandedDomains.has(cap.id);
          return (
            <div key={cap.id}>
              <div className="flex items-center gap-1">
                {children.length > 0 && (
                  <button
                    onClick={() => toggleExpand(cap.id)}
                    className="text-[10px] text-text-tertiary w-3 text-center hover:text-text-secondary"
                  >
                    {isExpanded ? '\u25be' : '\u25b8'}
                  </button>
                )}
                <div className={`flex-1 ${children.length === 0 ? 'ml-4' : ''}`}>
                  <CapabilityCard
                    capability={cap}
                    isHighlighted={highlightedIds.has(cap.id)}
                    capabilityView={capabilityView}
                    {...getSimData(cap.id)}
                  />
                </div>
              </div>
              {isExpanded && children.length > 0 && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  {children.map(child => (
                    <CapabilityCard
                      key={child.id}
                      capability={child}
                      isHighlighted={highlightedIds.has(child.id)}
                      capabilityView={capabilityView}
                      {...getSimData(child.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
