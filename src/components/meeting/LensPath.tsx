import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { DIMENSIONS } from '../../types';
import type { DimensionKey, Initiative, Horizon } from '../../types';

const DIMENSION_COLORS: Record<DimensionKey, string> = {
  ledelse: '#ef4444',
  virksomhet: '#22c55e',
  organisasjon: '#eab308',
  teknologi: '#6366f1',
};

interface InitiativeCardProps {
  initiative: Initiative;
  isHighlighted: boolean;
  onClick: (id: string) => void;
}

function InitiativeCard({ initiative, isHighlighted, onClick }: InitiativeCardProps) {
  const dimColor = DIMENSION_COLORS[initiative.dimension];

  return (
    <div
      className="rounded-lg p-3 cursor-pointer transition-all duration-150"
      style={{
        backgroundColor: 'var(--bg-hover)',
        border: isHighlighted
          ? `2px solid ${dimColor}`
          : '2px solid transparent',
        boxShadow: isHighlighted
          ? `0 0 12px 2px ${dimColor}55`
          : undefined,
      }}
      onClick={() => onClick(initiative.id)}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: dimColor }}
        />
        <div>
          <p className="text-lg font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
            {initiative.name}
          </p>
          {initiative.owner && (
            <p className="text-base mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {initiative.owner}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface CapabilityOverlayProps {
  initiative: Initiative;
  capabilities: { id: string; name: string }[];
  onClose: () => void;
}

function CapabilityOverlay({ initiative, capabilities, onClose }: CapabilityOverlayProps) {
  const linked = capabilities.filter(c => initiative.capabilities.includes(c.id));
  const dimColor = DIMENSION_COLORS[initiative.dimension];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg-app) 60%, transparent)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-hover)', border: `2px solid ${dimColor}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-6">
          <span
            className="mt-1.5 shrink-0 w-3 h-3 rounded-full"
            style={{ backgroundColor: dimColor }}
          />
          <h2 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {initiative.name}
          </h2>
        </div>

        {initiative.owner && (
          <p className="text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
            Owner: {initiative.owner}
          </p>
        )}

        {initiative.description && (
          <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {initiative.description}
          </p>
        )}

        {linked.length > 0 && (
          <div>
            <p className="text-sm uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              Capabilities
            </p>
            <div className="flex flex-wrap gap-2">
              {linked.map(cap => (
                <span
                  key={cap.id}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--border-medium)' }}
                >
                  {cap.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          className="mt-6 px-4 py-2 rounded text-sm transition-colors"
          style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--border-medium)' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function LensPath() {
  const activeScenario = useStore(s => s.activeScenario);
  const scenarioStates = useStore(s => s.scenarioStates);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = scenarioStates[activeScenario]?.initiatives ?? [];

  const [activeDimensions, setActiveDimensions] = useState<Set<DimensionKey>>(
    new Set(DIMENSIONS.map(d => d.key))
  );
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const toggleDimension = (key: DimensionKey) => {
    setActiveDimensions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCardClick = (id: string) => {
    setHighlightedId(prev => (prev === id ? null : id));
  };

  const highlightedInitiative = initiatives.find(i => i.id === highlightedId);

  const filteredDimensions = DIMENSIONS.filter(d => activeDimensions.has(d.key));

  const getInitiatives = (dimKey: DimensionKey, horizon: Horizon) =>
    initiatives
      .filter(i => i.dimension === dimKey && i.horizon === horizon)
      .sort((a, b) => a.order - b.order);

  return (
    <div
      className="fixed inset-0 overflow-auto pb-24"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      {/* Dimension filter */}
      <div className="sticky top-0 z-10 px-8 py-4 flex items-center gap-3" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-app) 80%, transparent)', backdropFilter: 'blur(8px)' }}>
        {DIMENSIONS.map(dim => (
          <button
            key={dim.key}
            onClick={() => toggleDimension(dim.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: activeDimensions.has(dim.key) ? `${dim.color}22` : 'var(--bg-hover)',
              color: activeDimensions.has(dim.key) ? dim.color : 'var(--text-secondary)',
              border: `2px solid ${activeDimensions.has(dim.key) ? dim.color : 'var(--border-medium)'}`,
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeDimensions.has(dim.key) ? dim.color : 'var(--border-medium)' }}
            />
            {dim.label}
          </button>
        ))}

        <div className="ml-auto flex gap-6 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
          <span>Near horizon</span>
          <span>Far horizon</span>
        </div>
      </div>

      {/* Swim lanes grid */}
      <div className="px-8 pt-4 space-y-4">
        {filteredDimensions.map(dim => {
          const nearInits = getInitiatives(dim.key, 'near');
          const farInits = getInitiatives(dim.key, 'far');

          return (
            <div key={dim.key} className="flex gap-0">
              {/* Dimension label */}
              <div
                className="w-40 shrink-0 flex items-start pt-3 pr-4"
                style={{ borderRight: `3px solid ${dim.color}33` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: dim.color }}
                  />
                  <span className="text-sm font-medium uppercase tracking-wide" style={{ color: dim.color }}>
                    {dim.label}
                  </span>
                </div>
              </div>

              {/* Near + Far columns */}
              <div className="flex flex-1 gap-0">
                {/* Near */}
                <div
                  className="flex-1 px-4 py-3 min-h-20"
                  style={{ borderRight: '1px solid var(--border-default)' }}
                >
                  {nearInits.length > 0 ? (
                    <div className="space-y-2">
                      {nearInits.map(init => (
                        <InitiativeCard
                          key={init.id}
                          initiative={init}
                          isHighlighted={highlightedId === init.id}
                          onClick={handleCardClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-sm" style={{ color: 'var(--border-medium)' }}>—</span>
                    </div>
                  )}
                </div>

                {/* Far */}
                <div className="flex-1 px-4 py-3 min-h-20">
                  {farInits.length > 0 ? (
                    <div className="space-y-2">
                      {farInits.map(init => (
                        <InitiativeCard
                          key={init.id}
                          initiative={init}
                          isHighlighted={highlightedId === init.id}
                          onClick={handleCardClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-sm" style={{ color: 'var(--border-medium)' }}>—</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Capability overlay when initiative is highlighted */}
      {highlightedInitiative && (
        <CapabilityOverlay
          initiative={highlightedInitiative}
          capabilities={capabilities}
          onClose={() => setHighlightedId(null)}
        />
      )}
    </div>
  );
}
