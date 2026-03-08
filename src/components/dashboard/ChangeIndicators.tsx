import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Snapshot, Initiative, Capability } from '../../types';

interface Props {
  snapshots: Snapshot[];
  initiatives: Initiative[];
  capabilities: Capability[];
}

export function ChangeIndicators({ snapshots, initiatives, capabilities }: Props) {
  const { t } = useTranslation();

  const changes = useMemo(() => {
    if (snapshots.length === 0) return null;
    const latest = snapshots[0];
    const prevData = latest.data;
    const prevInits = Object.values(prevData.scenarioStates).flatMap(s => s.initiatives);
    const prevCaps = prevData.capabilities;

    const items: { label: string; delta: string; color: string }[] = [];

    // Activities delta
    const initDelta = initiatives.length - prevInits.length;
    if (initDelta !== 0) {
      items.push({
        label: t('dashboard.activities'),
        delta: initDelta > 0 ? `+${initDelta}` : `${initDelta}`,
        color: initDelta > 0 ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200',
      });
    }

    // Capabilities delta
    const capDelta = capabilities.length - prevCaps.length;
    if (capDelta !== 0) {
      items.push({
        label: 'Kapabiliteter',
        delta: capDelta > 0 ? `+${capDelta}` : `${capDelta}`,
        color: capDelta > 0 ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200',
      });
    }

    // Maturity improvements
    const improvedCount = capabilities.filter(cap => {
      const prevCap = prevCaps.find(c => c.id === cap.id);
      return prevCap && cap.maturity > prevCap.maturity;
    }).length;
    if (improvedCount > 0) {
      items.push({
        label: 'Modenhet forbedret',
        delta: `${improvedCount} kap`,
        color: 'text-green-600 bg-green-50 border-green-200',
      });
    }

    return items;
  }, [snapshots, initiatives, capabilities, t]);

  if (!changes || changes.length === 0) return null;

  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      <span className="text-[9px] text-text-tertiary uppercase self-center">{t('dashboard.changes')}:</span>
      {changes.map((change, idx) => (
        <span key={idx} className={`px-2 py-0.5 text-[9px] font-medium rounded border ${change.color}`}>
          {change.label}: {change.delta}
        </span>
      ))}
    </div>
  );
}
