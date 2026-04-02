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

    // Build L1 → L2 children map for resolving resourceLoad
    const childrenOf = new Map<string, Capability[]>();
    for (const cap of capabilities) {
      if (cap.level === 2 && cap.parent) {
        const children = childrenOf.get(cap.parent) ?? [];
        children.push(cap);
        childrenOf.set(cap.parent, children);
      }
    }

    const loads: number[] = [];
    for (const init of initiatives) {
      for (const capId of init.capabilities) {
        const cap = capMap.get(capId);
        if (!cap) continue;
        if (cap.resourceLoad != null) {
          loads.push(cap.resourceLoad);
        } else if (cap.level === 1) {
          // L1 cap without resourceLoad — aggregate from L2 children
          const children = childrenOf.get(cap.id) ?? [];
          for (const child of children) {
            if (child.resourceLoad != null) {
              loads.push(child.resourceLoad);
            }
          }
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
