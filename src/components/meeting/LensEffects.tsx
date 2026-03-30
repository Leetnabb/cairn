import { useStore } from '../../stores/useStore';
import { EFFECT_TYPE_COLORS } from '../../types';
import type { EffectType } from '../../types';

const EFFECT_TYPES: EffectType[] = ['cost', 'quality', 'speed', 'compliance', 'strategic'];

const EFFECT_TYPE_LABELS: Record<EffectType, string> = {
  cost: 'Cost',
  quality: 'Quality',
  speed: 'Speed',
  compliance: 'Compliance',
  strategic: 'Strategic',
};

export function LensEffects() {
  const effects = useStore(s => s.effects);
  const activeScenario = useStore(s => s.activeScenario);
  const scenarioStates = useStore(s => s.scenarioStates);
  const initiatives = scenarioStates[activeScenario]?.initiatives ?? [];

  const getLinkedInitiativesCount = (initiativeIds: string[]) =>
    initiatives.filter(i => initiativeIds.includes(i.id)).length;

  const effectsByType = (type: EffectType) =>
    effects.filter(e => e.type === type).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const columns = EFFECT_TYPES.filter(type => effectsByType(type).length > 0);

  return (
    <div
      className="fixed inset-0 overflow-auto pb-24"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      <div className="px-8 pt-8">
        {columns.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
            No effects defined.
          </div>
        ) : (
          <div className="flex gap-6 min-w-max pb-4">
            {EFFECT_TYPES.map(type => {
              const typeEffects = effectsByType(type);
              if (typeEffects.length === 0) return null;

              const typeColor = EFFECT_TYPE_COLORS[type];
              const typeLabel = EFFECT_TYPE_LABELS[type];

              return (
                <div key={type} className="w-72 shrink-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide"
                      style={{
                        backgroundColor: `${typeColor}22`,
                        color: typeColor,
                        border: `1px solid ${typeColor}55`,
                      }}
                    >
                      {typeLabel}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {typeEffects.length}
                    </span>
                  </div>

                  {/* Effect cards */}
                  <div className="space-y-3">
                    {typeEffects.map(effect => {
                      const linkedCount = getLinkedInitiativesCount(effect.initiatives);
                      const hasMetrics = effect.baseline || effect.target;

                      return (
                        <div
                          key={effect.id}
                          className="rounded-lg p-4"
                          style={{
                            backgroundColor: 'var(--bg-hover)',
                            border: '1px solid var(--border-medium)',
                            borderLeft: `4px solid ${typeColor}`,
                          }}
                        >
                          <p className="text-lg font-medium leading-snug mb-2" style={{ color: 'var(--text-primary)' }}>
                            {effect.name}
                          </p>

                          {linkedCount > 0 && (
                            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                              {linkedCount} {linkedCount === 1 ? 'initiative' : 'initiatives'}
                            </p>
                          )}

                          {hasMetrics && (
                            <div
                              className="flex items-center gap-2 mt-3 pt-3 text-sm"
                              style={{ borderTop: '1px solid var(--border-medium)' }}
                            >
                              {effect.baseline && (
                                <span style={{ color: 'var(--text-secondary)' }}>{effect.baseline}</span>
                              )}
                              {effect.baseline && effect.target && (
                                <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                              )}
                              {effect.target && (
                                <span style={{ color: '#22c55e' }}>{effect.target}</span>
                              )}
                            </div>
                          )}

                          {effect.indicator && (
                            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                              {effect.indicator}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
