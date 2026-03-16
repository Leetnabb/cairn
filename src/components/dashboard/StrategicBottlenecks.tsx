import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { MATURITY_COLORS, RISK_COLORS } from '../../types';
import type { Capability } from '../../types';

interface BottleneckReason {
  key: string;
  label: string;
  color: string;
}

function getReasons(cap: Capability, linkedCount: number, t: (k: string) => string): BottleneckReason[] {
  const reasons: BottleneckReason[] = [];
  if (cap.risk === 3 && cap.maturity === 1) {
    reasons.push({ key: 'highRisk', label: t('dashboard.bottleneckHighRisk'), color: '#ef4444' });
  }
  if (!cap.maturityTarget) {
    reasons.push({ key: 'noTarget', label: t('dashboard.bottleneckNoTarget'), color: '#f59e0b' });
  }
  if (linkedCount === 0) {
    reasons.push({ key: 'noInits', label: t('dashboard.bottleneckNoInitiatives'), color: '#6b7280' });
  }
  return reasons;
}

export function StrategicBottlenecks() {
  const { t } = useTranslation();
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? []);
  const setSelectedItem = useStore(s => s.setSelectedItem);

  const bottlenecks = useMemo(() => {
    return capabilities
      .filter(c => c.level === 1)
      .map(cap => {
        const childIds = capabilities.filter(c => c.parent === cap.id).map(c => c.id);
        const allIds = new Set([cap.id, ...childIds]);
        const linkedCount = initiatives.filter(i => i.capabilities.some(cid => allIds.has(cid))).length;
        const reasons = getReasons(cap, linkedCount, t);
        return { cap, linkedCount, reasons };
      })
      .filter(b => b.reasons.length > 0)
      .sort((a, b) => b.reasons.length - a.reasons.length);
  }, [capabilities, initiatives, t]);

  if (bottlenecks.length === 0) {
    return <p className="text-[10px] text-text-tertiary italic">{t('common.none')}</p>;
  }

  return (
    <div className="space-y-1.5">
      {bottlenecks.map(({ cap, linkedCount, reasons }) => (
        <button
          key={cap.id}
          onClick={() => setSelectedItem({ type: 'capability', id: cap.id })}
          className="w-full text-left rounded border border-border bg-white hover:bg-gray-50 px-2.5 py-1.5 transition-colors"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
            <span className="text-[10px] font-medium text-text-primary truncate flex-1">{cap.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[8px] text-text-tertiary">M:{cap.maturity}</span>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RISK_COLORS[cap.risk] }} />
              <span className="text-[8px] text-text-tertiary">{linkedCount} akt.</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {reasons.map(r => (
              <span
                key={r.key}
                className="px-1.5 py-0.5 rounded text-[8px] font-medium text-white"
                style={{ backgroundColor: r.color }}
              >
                {r.label}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
