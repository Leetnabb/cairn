import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative, Capability } from '../../types';

interface ResourceBarProps {
  initiatives: Initiative[];
  capabilities: Capability[];
}

export function ResourceBar({ initiatives, capabilities }: ResourceBarProps) {
  const { t } = useTranslation();
  const { load, pct, color, bgColor, activeCount, totalCount } = useMemo(() => {
    if (initiatives.length === 0) return { load: 0, pct: 0, color: '#64748b', bgColor: '#f1f5f9', activeCount: 0, totalCount: 0 };

    const active = initiatives.filter(i =>
      i.status === 'in_progress' || (!i.status && i.horizon === 'near')
    );
    const total = initiatives.length;
    const activeN = active.length;

    // Also factor in capability resourceLoad for linked caps
    const capMap = new Map<string, Capability>();
    for (const cap of capabilities) capMap.set(cap.id, cap);

    const childrenOf = new Map<string, Capability[]>();
    for (const cap of capabilities) {
      if (cap.level === 2 && cap.parent) {
        const children = childrenOf.get(cap.parent) ?? [];
        children.push(cap);
        childrenOf.set(cap.parent, children);
      }
    }

    // Collect resourceLoad from all caps touched by these initiatives
    const capLoads: number[] = [];
    const seenCaps = new Set<string>();
    for (const init of initiatives) {
      for (const capId of init.capabilities) {
        if (seenCaps.has(capId)) continue;
        seenCaps.add(capId);
        const cap = capMap.get(capId);
        if (!cap) continue;
        if (cap.resourceLoad != null) {
          capLoads.push(cap.resourceLoad);
        } else if (cap.level === 1) {
          for (const child of (childrenOf.get(cap.id) ?? [])) {
            if (!seenCaps.has(child.id) && child.resourceLoad != null) {
              seenCaps.add(child.id);
              capLoads.push(child.resourceLoad);
            }
          }
        }
      }
    }

    // Combine: initiative activity ratio + avg capability load
    const activityRatio = total > 0 ? activeN / Math.max(total, 3) : 0; // normalized: 3+ active = high
    const avgCapLoad = capLoads.length > 0
      ? capLoads.reduce((s, l) => s + l, 0) / capLoads.length
      : 0.5; // default medium if no cap data

    // Weighted: 40% activity density, 60% capability load
    const combined = capLoads.length > 0
      ? activityRatio * 0.4 + avgCapLoad * 0.6
      : activityRatio;

    const clamped = Math.min(combined, 1);
    const p = Math.round(clamped * 100);
    const c = clamped > 0.8 ? '#dc2626' : clamped >= 0.6 ? '#f59e0b' : '#22c55e';
    const bg = clamped > 0.8 ? '#fef2f2' : clamped >= 0.6 ? '#fffbeb' : '#f0fdf4';

    return { load: clamped, pct: p, color: c, bgColor: bg, activeCount: activeN, totalCount: total };
  }, [initiatives, capabilities]);

  if (initiatives.length === 0) return null;

  return (
    <div className="relative w-full mt-2 px-1">
      <div
        className="h-3 w-full rounded-full border overflow-hidden"
        style={{ backgroundColor: bgColor, borderColor: `${color}33` }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
        />
      </div>
      <div className="flex justify-between items-center mt-0.5 px-0.5">
        <span className="text-[8px] text-text-tertiary">
          {t('resourceBar.summary', { active: activeCount, total: totalCount })}
        </span>
        <span className="text-[8px] font-medium" style={{ color }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
