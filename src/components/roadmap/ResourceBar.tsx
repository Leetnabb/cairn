import { useMemo } from 'react';
import type { Initiative, Capability } from '../../types';

interface ResourceBarProps {
  initiatives: Initiative[];
  capabilities: Capability[];
}

export function ResourceBar({ initiatives, capabilities }: ResourceBarProps) {
  const { avgLoad, color } = useMemo(() => {
    if (initiatives.length === 0) return { avgLoad: 0, color: '#64748b' };

    const capMap = new Map<string, Capability>();
    for (const cap of capabilities) capMap.set(cap.id, cap);

    const loads: number[] = [];
    for (const init of initiatives) {
      for (const capId of init.capabilities) {
        const cap = capMap.get(capId);
        if (cap?.resourceLoad != null) {
          loads.push(cap.resourceLoad);
        }
      }
    }

    if (loads.length === 0) return { avgLoad: 0, color: '#64748b' };

    const avg = loads.reduce((sum, l) => sum + l, 0) / loads.length;
    const c = avg > 0.9 ? '#dc2626' : avg >= 0.7 ? '#f59e0b' : '#64748b';
    return { avgLoad: avg, color: c };
  }, [initiatives, capabilities]);

  if (initiatives.length === 0) return null;

  const pct = Math.round(avgLoad * 100);

  return (
    <div className="relative w-full mt-1 px-1">
      <div
        className="h-2 w-full rounded-full"
        style={{ backgroundColor: color, opacity: avgLoad === 0 ? 0.2 : 0.7 }}
      />
      {avgLoad > 0 && (
        <span className="absolute right-1.5 -top-0.5 text-[7px] font-medium" style={{ color }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
