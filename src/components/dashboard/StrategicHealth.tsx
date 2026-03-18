import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative, Capability, Effect, Snapshot } from '../../types';
import { DIMENSIONS } from '../../types';

interface Props {
  initiatives: Initiative[];
  capabilities: Capability[];
  effects: Effect[];
  snapshots: Snapshot[];
}

interface DeltaProps {
  value: number;
  suffix?: string;
}

function DeltaIndicator({ value, suffix = '' }: DeltaProps) {
  if (value === 0) {
    return <span className="text-xs text-slate-500">—</span>;
  }
  const isPositive = value > 0;
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

export function StrategicHealth({ initiatives, capabilities, effects: _effects, snapshots }: Props) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const totalInitiatives = initiatives.length;

    // Coverage: initiatives with at least one capability linked
    const linkedInitiatives = initiatives.filter(i => i.capabilities.length > 0).length;
    const coveragePercent = totalInitiatives > 0
      ? Math.round((linkedInitiatives / totalInitiatives) * 100)
      : 100;

    // Avg maturity across level-1 capabilities
    const l1Caps = capabilities.filter(c => c.level === 1);
    const avgMaturity = l1Caps.length > 0
      ? parseFloat((l1Caps.reduce((acc, c) => acc + c.maturity, 0) / l1Caps.length).toFixed(1))
      : 0;

    // Target gap: avg target maturity - avg maturity
    const capsWithTarget = l1Caps.filter(c => c.maturityTarget);
    const avgTargetMaturity = capsWithTarget.length > 0
      ? parseFloat((capsWithTarget.reduce((acc, c) => acc + (c.maturityTarget ?? c.maturity), 0) / capsWithTarget.length).toFixed(1))
      : avgMaturity;
    const maturityGap = parseFloat((avgTargetMaturity - avgMaturity).toFixed(1));

    // Drift: initiatives with no capability linked
    const driftCount = totalInitiatives - linkedInitiatives;

    // Dimension distribution
    const dimCounts = DIMENSIONS.map(dim => ({
      key: dim.key,
      color: dim.color,
      count: initiatives.filter(i => i.dimension === dim.key).length,
    }));
    const dimTotal = dimCounts.reduce((acc, d) => acc + d.count, 0) || 1;

    // Delta from last snapshot
    let initiativesDelta = 0;
    if (snapshots.length > 0) {
      const lastSnapshot = snapshots[snapshots.length - 1];
      const scenarioStates = lastSnapshot.data.scenarioStates;
      const activeScenario = lastSnapshot.data.activeScenario;
      const prevInitiatives = scenarioStates[activeScenario]?.initiatives ?? [];
      initiativesDelta = totalInitiatives - prevInitiatives.length;
    }

    return {
      totalInitiatives,
      initiativesDelta,
      coveragePercent,
      avgMaturity,
      maturityGap,
      driftCount,
      dimCounts,
      dimTotal,
    };
  }, [initiatives, capabilities, snapshots]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {/* 1. Total initiatives */}
      <div className="bg-slate-800 rounded border border-slate-700 px-4 py-3">
        <div className="text-3xl font-bold text-white leading-tight">{stats.totalInitiatives}</div>
        <div className="text-sm text-slate-400 mt-0.5">{t('dashboard.activities')}</div>
        <div className="mt-1">
          <DeltaIndicator value={stats.initiativesDelta} />
        </div>
      </div>

      {/* 2. Coverage % */}
      <div className="bg-slate-800 rounded border border-slate-700 px-4 py-3">
        <div
          className="text-3xl font-bold leading-tight"
          style={{
            color: stats.coveragePercent === 100 ? '#22c55e'
              : stats.coveragePercent >= 70 ? '#f59e0b'
              : '#ef4444',
          }}
        >
          {stats.coveragePercent}%
        </div>
        <div className="text-sm text-slate-400 mt-0.5">{t('dashboard.strategyCoverage')}</div>
        <div className="mt-1">
          {stats.driftCount > 0 ? (
            <span className="text-xs text-red-400">{stats.driftCount} {t('dashboard.strategyDriftCount', { count: stats.driftCount }).replace(/^\d+\s*/, '') || 'uten kobling'}</span>
          ) : (
            <span className="text-xs text-green-400">Full dekning</span>
          )}
        </div>
      </div>

      {/* 3. Avg maturity */}
      <div className="bg-slate-800 rounded border border-slate-700 px-4 py-3">
        <div
          className="text-3xl font-bold leading-tight"
          style={{
            color: stats.avgMaturity >= 2.5 ? '#22c55e'
              : stats.avgMaturity >= 1.5 ? '#f59e0b'
              : '#ef4444',
          }}
        >
          {stats.avgMaturity > 0 ? stats.avgMaturity : '—'}
        </div>
        <div className="text-sm text-slate-400 mt-0.5">{t('dashboard.maturityNowTarget', 'Snitt modenhet')}</div>
        <div className="mt-1">
          {stats.maturityGap > 0 ? (
            <span className="text-xs text-amber-400">gap +{stats.maturityGap}</span>
          ) : (
            <span className="text-xs text-slate-500">Ingen gap</span>
          )}
        </div>
      </div>

      {/* 4. Drift */}
      <div className="bg-slate-800 rounded border border-slate-700 px-4 py-3">
        <div
          className="text-3xl font-bold leading-tight"
          style={{ color: stats.driftCount === 0 ? '#22c55e' : '#ef4444' }}
        >
          {stats.driftCount}
        </div>
        <div className="text-sm text-slate-400 mt-0.5">Drift</div>
        <div className="mt-1">
          {stats.driftCount === 0 ? (
            <span className="text-xs text-green-400">Ingen drift</span>
          ) : (
            <span className="text-xs text-red-400">Uten kapabilitet</span>
          )}
        </div>
      </div>

      {/* 5. Dimensions mini bar */}
      <div className="bg-slate-800 rounded border border-slate-700 px-4 py-3">
        <div className="text-3xl font-bold text-white leading-tight">
          {stats.dimCounts.filter(d => d.count > 0).length}
          <span className="text-sm font-normal text-slate-500">/{DIMENSIONS.length}</span>
        </div>
        <div className="text-sm text-slate-400 mt-0.5">Dimensjoner</div>
        <div className="mt-2 flex gap-0.5 h-2">
          {stats.dimCounts.map(dim => (
            <div
              key={dim.key}
              className="rounded-sm"
              style={{
                flex: dim.count,
                backgroundColor: dim.color,
                minWidth: dim.count > 0 ? '4px' : '0',
                opacity: dim.count > 0 ? 1 : 0.15,
              }}
              title={`${dim.key}: ${dim.count}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
