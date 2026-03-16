import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { EFFECT_TYPE_COLORS } from '../../types';
import type { EffectType } from '../../types';
import { getMergedCriticalPath } from '../../lib/criticalPath';
import { simulateMaturity } from '../../lib/simulation';
import { KPICard } from './KPICard';
import { OwnerLoad } from './OwnerLoad';
import { ValueChainView } from './ValueChainView';
import { SnapshotList } from './SnapshotList';
import { ExecutiveSummary } from './ExecutiveSummary';
import { EffectFunnel } from './EffectFunnel';
import { DimensionHealth } from './DimensionHealth';
import { MaturityJourney } from './MaturityJourney';
import { CriticalPathNarrative } from './CriticalPathNarrative';
import { ActionableWarnings } from './ActionableWarnings';
import { ChangeIndicators } from './ChangeIndicators';

export function Dashboard() {
  const { t } = useTranslation();
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const valueChains = useStore(s => s.valueChains);
  const effects = useStore(s => s.effects);
  const snapshots = useStore(s => s.snapshots);
  const setSelectedItem = useStore(s => s.setSelectedItem);

  const { merged: criticalPath, auto: autoCriticalPath } = useMemo(() => getMergedCriticalPath(initiatives), [initiatives]);
  const manualCount = useMemo(() => {
    let count = 0;
    for (const id of criticalPath) {
      if (!autoCriticalPath.has(id)) count++;
    }
    return count;
  }, [criticalPath, autoCriticalPath]);
  const autoCount = criticalPath.size - manualCount;
  const simulated = useMemo(() => simulateMaturity(capabilities, initiatives), [capabilities, initiatives]);

  const totalDeps = initiatives.reduce((acc, i) => acc + i.dependsOn.length, 0);
  const avgMaturity = capabilities.length > 0
    ? (capabilities.reduce((acc, c) => acc + c.maturity, 0) / capabilities.length).toFixed(1)
    : '0';
  const avgSimMaturity = simulated.length > 0
    ? (simulated.reduce((acc, c) => acc + c.simulatedMaturity, 0) / simulated.length).toFixed(1)
    : '0';

  const linkedInitiatives = initiatives.filter(i => i.capabilities.length > 0).length;
  const strategyCoveragePercent = initiatives.length > 0
    ? Math.round((linkedInitiatives / initiatives.length) * 100)
    : 100;
  const driftCount = initiatives.length - linkedInitiatives;

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* 1. Executive Summary */}
      <ExecutiveSummary initiatives={initiatives} capabilities={capabilities} effects={effects} />

      {/* 2. Change indicators */}
      <ChangeIndicators snapshots={snapshots} initiatives={initiatives} capabilities={capabilities} />

      {/* 3. Effect Funnel */}
      <EffectFunnel initiatives={initiatives} capabilities={capabilities} effects={effects} />

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <KPICard label={t('dashboard.activities')} value={initiatives.length} />
        <KPICard label={t('dashboard.maturityNowTarget')} value={`${avgMaturity} \u2192 ${avgSimMaturity}`} color="#6366f1" />
        <KPICard label={t('dashboard.criticalPath')} value={criticalPath.size} sublabel={t('dashboard.autoManual', { auto: autoCount, manual: manualCount })} />
        <KPICard label={t('dashboard.dependencies')} value={totalDeps} />
        <KPICard
          label={t('dashboard.strategyCoverage')}
          value={`${strategyCoveragePercent}%`}
          color={strategyCoveragePercent === 100 ? '#22c55e' : strategyCoveragePercent >= 70 ? '#f59e0b' : '#ef4444'}
          sublabel={driftCount > 0 ? t('dashboard.strategyDriftCount', { count: driftCount }) : undefined}
        />
      </div>

      {/* 4. Two-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Dimension Health */}
        <div className="bg-white rounded border border-border p-3">
          <h3 className="text-[11px] font-semibold mb-2">{t('dashboard.dimensionHealth')}</h3>
          <DimensionHealth initiatives={initiatives} />
        </div>

        {/* Maturity Journey */}
        <div className="bg-white rounded border border-border p-3">
          <h3 className="text-[11px] font-semibold mb-2">{t('dashboard.maturityJourney')}</h3>
          <MaturityJourney capabilities={capabilities} initiatives={initiatives} />
        </div>

        {/* Owner Load with threshold */}
        <div className="bg-white rounded border border-border p-3">
          <h3 className="text-[11px] font-semibold mb-2">{t('dashboard.ownerLoad')}</h3>
          <OwnerLoad initiatives={initiatives} />
        </div>

        {/* Critical Path Narrative */}
        <div className="bg-white rounded border border-border p-3">
          <h3 className="text-[11px] font-semibold mb-2">{t('dashboard.criticalPathNarrative')}</h3>
          <CriticalPathNarrative initiatives={initiatives} />
        </div>

        {/* Actionable Warnings */}
        <div className="bg-white rounded border border-border p-3">
          <h3 className="text-[11px] font-semibold mb-2">{t('dashboard.warnings')}</h3>
          <ActionableWarnings initiatives={initiatives} capabilities={capabilities} effects={effects} />
        </div>

        {/* Value Chains */}
        <div className="bg-white rounded border border-border p-3">
          <h3 className="text-[11px] font-semibold mb-2">{t('dashboard.valueChains')}</h3>
          <ValueChainView initiatives={initiatives} valueChains={valueChains} />
        </div>

        {/* Effect overview */}
        <div className="bg-white rounded border border-border p-3">
          <h3 className="text-[11px] font-semibold mb-2">{t('effects.title')}</h3>
          {effects.length === 0 ? (
            <p className="text-[10px] text-text-tertiary italic">{t('common.none')}</p>
          ) : (
            <div className="space-y-1">
              {(['cost', 'quality', 'speed', 'compliance', 'strategic'] as EffectType[]).map(type => {
                const typeEffects = effects.filter(e => e.type === type);
                if (typeEffects.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="px-1.5 py-0.5 text-[8px] font-medium rounded text-white" style={{ backgroundColor: EFFECT_TYPE_COLORS[type] }}>
                        {t(`effects.types.${type}`)}
                      </span>
                      <span className="text-[9px] text-text-tertiary">{typeEffects.length}</span>
                    </div>
                    <div className="space-y-0.5 ml-1">
                      {typeEffects.map(e => (
                        <button key={e.id}
                          onClick={() => setSelectedItem({ type: 'effect', id: e.id })}
                          className="block w-full text-left px-2 py-0.5 text-[10px] rounded hover:bg-gray-50 text-primary truncate">
                          {e.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Snapshots */}
        <div className="bg-white rounded border border-border p-3">
          <SnapshotList />
        </div>
      </div>
    </div>
  );
}
