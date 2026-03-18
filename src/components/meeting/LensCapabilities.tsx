import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import type { Capability, Initiative } from '../../types';

const MATURITY_COLORS: Record<number, string> = {
  1: '#dc2626',
  2: '#f59e0b',
  3: '#22c55e',
};

const MATURITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

const RISK_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#f59e0b',
  3: '#dc2626',
};

interface DetailOverlayProps {
  capability: Capability;
  linkedInitiatives: Initiative[];
  onClose: () => void;
}

function DetailOverlay({ capability, linkedInitiatives, onClose }: DetailOverlayProps) {
  const matColor = MATURITY_COLORS[capability.maturity];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: '#0f172a99' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl"
        style={{ backgroundColor: '#1e293b', border: '2px solid #334155' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-medium mb-2" style={{ color: '#f1f5f9' }}>
          {capability.name}
        </h2>

        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center gap-1.5 text-sm" style={{ color: matColor }}>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: matColor }}
            />
            Maturity: {MATURITY_LABELS[capability.maturity]}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-sm" style={{ color: RISK_COLORS[capability.risk] }}>
            Risk: {MATURITY_LABELS[capability.risk]}
          </span>
        </div>

        {capability.description && (
          <p className="text-base leading-relaxed mb-6" style={{ color: '#cbd5e1' }}>
            {capability.description}
          </p>
        )}

        {linkedInitiatives.length > 0 && (
          <div>
            <p className="text-sm uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>
              Linked initiatives ({linkedInitiatives.length})
            </p>
            <div className="space-y-2">
              {linkedInitiatives.map(init => (
                <div
                  key={init.id}
                  className="px-3 py-2 rounded"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                >
                  <p className="text-sm" style={{ color: '#e2e8f0' }}>{init.name}</p>
                  {init.owner && (
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{init.owner}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="mt-6 px-4 py-2 rounded text-sm transition-colors"
          style={{ backgroundColor: '#0f172a', color: '#64748b', border: '1px solid #334155' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function LensCapabilities() {
  const capabilities = useStore(s => s.capabilities);
  const activeScenario = useStore(s => s.activeScenario);
  const scenarioStates = useStore(s => s.scenarioStates);
  const initiatives = scenarioStates[activeScenario]?.initiatives ?? [];

  const [selectedCapId, setSelectedCapId] = useState<string | null>(null);

  const l1Caps = capabilities.filter(c => c.level === 1).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const getSubCaps = (parentId: string) =>
    capabilities
      .filter(c => c.level === 2 && c.parent === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const getLinkedInitiatives = (capId: string) =>
    initiatives.filter(i => i.capabilities.includes(capId));

  const selectedCap = capabilities.find(c => c.id === selectedCapId);
  const selectedLinkedInits = selectedCapId ? getLinkedInitiatives(selectedCapId) : [];

  return (
    <div
      className="fixed inset-0 overflow-auto pb-24"
      style={{ backgroundColor: '#0f172a' }}
    >
      <div className="px-8 pt-8">
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {l1Caps.map(cap => {
            const linkedCount = getLinkedInitiatives(cap.id).length;
            const subCaps = getSubCaps(cap.id);
            const matColor = MATURITY_COLORS[cap.maturity];
            const riskColor = RISK_COLORS[cap.risk];

            return (
              <div
                key={cap.id}
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:scale-[1.01]"
                style={{
                  backgroundColor: '#1e293b',
                  border: selectedCapId === cap.id ? '2px solid #6366f1' : '2px solid #334155',
                  boxShadow: selectedCapId === cap.id ? '0 0 16px 2px #6366f155' : undefined,
                }}
                onClick={() => setSelectedCapId(prev => prev === cap.id ? null : cap.id)}
              >
                {/* Risk stripe */}
                <div className="h-1.5" style={{ backgroundColor: riskColor }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-medium leading-snug" style={{ color: '#f1f5f9' }}>
                      {cap.name}
                    </h3>
                    <span
                      className="ml-3 shrink-0 w-3 h-3 rounded-full mt-1"
                      style={{ backgroundColor: matColor }}
                      title={`Maturity: ${MATURITY_LABELS[cap.maturity]}`}
                    />
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <span style={{ color: matColor }}>
                      {MATURITY_LABELS[cap.maturity]} maturity
                    </span>
                    <span style={{ color: '#475569' }}>·</span>
                    <span style={{ color: '#94a3b8' }}>
                      {linkedCount} {linkedCount === 1 ? 'initiative' : 'initiatives'}
                    </span>
                  </div>

                  {subCaps.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {subCaps.map(sub => {
                        const subLinked = getLinkedInitiatives(sub.id).length;
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between px-3 py-1.5 rounded"
                            style={{ backgroundColor: '#0f172a' }}
                          >
                            <span className="text-sm" style={{ color: '#94a3b8' }}>
                              {sub.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: MATURITY_COLORS[sub.maturity] }}
                              />
                              {subLinked > 0 && (
                                <span className="text-xs" style={{ color: '#64748b' }}>
                                  {subLinked}
                                </span>
                              )}
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

          {l1Caps.length === 0 && (
            <div className="col-span-full text-center py-20" style={{ color: '#475569' }}>
              No capabilities defined.
            </div>
          )}
        </div>
      </div>

      {selectedCap && (
        <DetailOverlay
          capability={selectedCap}
          linkedInitiatives={selectedLinkedInits}
          onClose={() => setSelectedCapId(null)}
        />
      )}
    </div>
  );
}
