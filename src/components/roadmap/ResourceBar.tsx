import { useMemo } from 'react';
import type { Initiative, Capability } from '../../types';

interface ResourceBarProps {
  initiatives: Initiative[];
  capabilities: Capability[];
}

export function ResourceBar({ initiatives, capabilities }: ResourceBarProps) {
  const { avgLoad, color, bgColor } = useMemo(() => {
    if (initiatives.length === 0) return { avgLoad: 0, color: '#64748b', bgColor: '#f1f5f9' };

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
          const children = childrenOf.get(cap.id) ?? [];
          for (const child of children) {
            if (child.resourceLoad != null) {
              loads.push(child.resourceLoad);
            }
          }
        }
      }
    }

    if (loads.length === 0) return { avgLoad: 0, color: '#64748b', bgColor: '#f1f5f9' };

    const avg = loads.reduce((sum, l) => sum + l, 0) / loads.length;
    const c = avg > 0.9 ? '#dc2626' : avg >= 0.7 ? '#f59e0b' : '#22c55e';
    const bg = avg > 0.9 ? '#fef2f2' : avg >= 0.7 ? '#fffbeb' : '#f0fdf4';
    return { avgLoad: avg, color: c, bgColor: bg };
  }, [initiatives, capabilities]);

  if (initiatives.length === 0) return null;

  const pct = Math.round(avgLoad * 100);

  return (
    <div className="relative w-full mt-2 px-1">
      {/* Background track */}
      <div
        className="h-3 w-full rounded-full border overflow-hidden"
        style={{ backgroundColor: bgColor, borderColor: `${color}33` }}
      >
        {/* Fill bar */}
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            opacity: 0.8,
          }}
        />
      </div>
      {/* Label */}
      <div className="flex justify-between items-center mt-0.5 px-0.5">
        <span className="text-[8px] text-text-tertiary">Kapasitet</span>
        <span className="text-[8px] font-medium" style={{ color }}>
          {pct > 0 ? `${pct}%` : '–'}
        </span>
      </div>
    </div>
  );
}
