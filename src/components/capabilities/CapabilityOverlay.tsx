import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { MATURITY_COLORS } from '../../types';
import { simulateMaturity } from '../../lib/simulation';
import { EMPTY_INITIATIVES } from '../../stores/useStore';

export function CapabilityOverlay() {
  const { t } = useTranslation();
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const simulationEnabled = useStore(s => s.ui.simulationEnabled);
  const setCapabilityOverlayOpen = useStore(s => s.setCapabilityOverlayOpen);
  const setSelectedItem = useStore(s => s.setSelectedItem);

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

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCapabilityOverlayOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setCapabilityOverlayOpen]);

  const getSimData = (id: string) => {
    if (!simulated) return null;
    return simulated.find(c => c.id === id) ?? null;
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay panel */}
      <div className="w-[340px] h-full bg-white border-r border-border shadow-lg overflow-y-auto animate-slide-in-left">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-[13px] font-semibold">{t('nav.capabilityMap')}</h2>
          <button
            onClick={() => setCapabilityOverlayOpen(false)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-text-tertiary text-[14px]"
          >
            &times;
          </button>
        </div>
        <div className="p-3 grid grid-cols-1 gap-2">
          {l1.map(cap => {
            const children = l2ByParent[cap.id] ?? [];
            const sim = getSimData(cap.id);
            return (
              <div key={cap.id} className="rounded border border-border p-2">
                <button
                  onClick={() => {
                    setSelectedItem({ type: 'capability', id: cap.id });
                    setCapabilityOverlayOpen(false);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-text-primary">{cap.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
                      {sim && sim.improved && (
                        <span className="text-[8px] text-green-600">&rarr; {sim.simulatedMaturity}</span>
                      )}
                    </div>
                  </div>
                </button>
                {children.length > 0 && (
                  <div className="mt-1.5 space-y-0.5 ml-1">
                    {children.map(child => {
                      const childSim = getSimData(child.id);
                      return (
                        <button
                          key={child.id}
                          onClick={() => {
                            setSelectedItem({ type: 'capability', id: child.id });
                            setCapabilityOverlayOpen(false);
                          }}
                          className="w-full text-left flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-gray-50"
                        >
                          <span className="text-[10px] text-text-secondary">{child.name}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MATURITY_COLORS[child.maturity] }} />
                            {childSim && childSim.improved && (
                              <span className="text-[7px] text-green-600">&rarr;{childSim.simulatedMaturity}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Click-outside backdrop */}
      <div
        className="flex-1 bg-black/20"
        onClick={() => setCapabilityOverlayOpen(false)}
      />
    </div>
  );
}
