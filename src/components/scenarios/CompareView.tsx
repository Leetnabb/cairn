import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSIONS, EFFECT_TYPE_COLORS } from '../../types';
import type { EffectType } from '../../types';

export function CompareView() {
  const { t } = useTranslation();
  const scenarios = useStore(s => s.scenarios);
  const scenarioStates = useStore(s => s.scenarioStates);
  const activeScenario = useStore(s => s.activeScenario);
  const compareScenario = useStore(s => s.ui.compareScenario);
  const setCompareScenario = useStore(s => s.setCompareScenario);

  const effects = useStore(s => s.effects);
  const activeInits = scenarioStates[activeScenario]?.initiatives ?? EMPTY_INITIATIVES;
  const compareInits = compareScenario ? (scenarioStates[compareScenario]?.initiatives ?? EMPTY_INITIATIVES) : EMPTY_INITIATIVES;

  const otherScenarios = scenarios.filter(s => s.id !== activeScenario);

  // Diff computation
  const diff = useMemo(() => {
    if (!compareScenario) return null;
    const aMap = new Map(activeInits.map(i => [i.name, i]));
    const bMap = new Map(compareInits.map(i => [i.name, i]));
    const result: Record<string, 'same' | 'moved' | 'only-a' | 'only-b'> = {};
    for (const i of activeInits) {
      const b = bMap.get(i.name);
      if (!b) result[i.id] = 'only-a';
      else if (b.dimension !== i.dimension || b.horizon !== i.horizon) result[i.id] = 'moved';
      else result[i.id] = 'same';
    }
    for (const i of compareInits) {
      if (!aMap.has(i.name)) result[i.id] = 'only-b';
    }
    return result;
  }, [activeInits, compareInits, compareScenario]);

  const diffColor = (status?: string) => {
    switch (status) {
      case 'moved': return 'bg-yellow-100 border-yellow-300';
      case 'only-a': return 'bg-red-50 border-red-300';
      case 'only-b': return 'bg-green-50 border-green-300';
      default: return 'bg-white border-border';
    }
  };

  if (!compareScenario) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[12px] text-text-secondary mb-3">{t('scenarios.selectCompare')}</p>
          <div className="flex gap-2 justify-center">
            {otherScenarios.map(s => (
              <button
                key={s.id}
                onClick={() => setCompareScenario(s.id)}
                className="px-3 py-1.5 text-[11px] font-medium rounded border border-border hover:border-primary hover:text-primary transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
          {otherScenarios.length === 0 && (
            <p className="text-[11px] text-text-tertiary mt-2">{t('scenarios.createToCompare')}</p>
          )}
        </div>
      </div>
    );
  }

  const activeLabel = scenarios.find(s => s.id === activeScenario)?.name ?? 'A';
  const compareLabel = scenarios.find(s => s.id === compareScenario)?.name ?? 'B';

  const renderSide = (inits: typeof activeInits) => (
    <div className="flex-1 p-3 overflow-auto">
      {DIMENSIONS.map(dim => (
        <div key={dim.key} className="mb-2">
          <div className="text-[10px] font-semibold mb-1 flex items-center gap-1" style={{ color: dim.textColor }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dim.color }} />
            {t(`labels.dimensions.${dim.key}`)}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {(['near', 'far'] as const).map(h => (
              <div key={h} className="space-y-0.5">
                <div className="text-[8px] text-text-tertiary">{t(`labels.horizon.${h}`)}</div>
                {inits.filter(i => i.dimension === dim.key && i.horizon === h).sort((a, b) => a.order - b.order).map(i => {
                  const status = diff?.[i.id];
                  return (
                    <div key={i.id} className={`px-2 py-1 rounded border text-[9px] ${diffColor(status)}`}
                      style={{ borderLeftWidth: 3, borderLeftColor: dim.color }}>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-text-tertiary">{i.owner}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-gray-50">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-yellow-300 bg-yellow-100" />
          <span className="text-[9px] text-text-secondary">{t('scenarios.changedPosition')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-red-300 bg-red-50" />
          <span className="text-[9px] text-text-secondary">{t('scenarios.onlyIn', { name: activeLabel })}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-green-300 bg-green-50" />
          <span className="text-[9px] text-text-secondary">{t('scenarios.onlyIn', { name: compareLabel })}</span>
        </div>
        <div className="ml-auto">
          <button onClick={() => setCompareScenario(null)} className="text-[10px] text-text-tertiary hover:text-text-secondary">
            {t('scenarios.closeCompare')}
          </button>
        </div>
      </div>
      {/* Effect coverage */}
      {effects.length > 0 && (
        <div className="px-4 py-1.5 border-b border-border bg-white">
          <div className="text-[10px] font-semibold mb-1">{t('effects.effectCoverage')}</div>
          <div className="flex gap-3">
            {(['cost', 'quality', 'speed', 'compliance', 'strategic'] as EffectType[]).map(type => {
              const typeEffects = effects.filter(e => e.type === type);
              if (typeEffects.length === 0) return null;
              const activeInitIds = new Set(activeInits.map(i => i.id));
              const compareInitIds = new Set(compareInits.map(i => i.id));
              const aCov = typeEffects.filter(e => e.initiatives.some(id => activeInitIds.has(id))).length;
              const bCov = typeEffects.filter(e => e.initiatives.some(id => compareInitIds.has(id))).length;
              return (
                <div key={type} className="flex items-center gap-1">
                  <span className="px-1 py-0.5 text-[7px] font-medium rounded text-white" style={{ backgroundColor: EFFECT_TYPE_COLORS[type] }}>
                    {t(`effects.types.${type}`)}
                  </span>
                  <span className="text-[9px] text-text-secondary">{aCov}/{typeEffects.length}</span>
                  <span className="text-[9px] text-text-tertiary">vs</span>
                  <span className="text-[9px] text-text-secondary">{bCov}/{typeEffects.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Side by side */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-border flex flex-col">
          <div className="px-3 py-1 bg-gray-50 text-[10px] font-semibold text-text-secondary border-b border-border">{activeLabel}</div>
          {renderSide(activeInits)}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-1 bg-gray-50 text-[10px] font-semibold text-text-secondary border-b border-border">{compareLabel}</div>
          {renderSide(compareInits)}
        </div>
      </div>
    </div>
  );
}
