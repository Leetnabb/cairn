import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative, Capability } from '../../types';

interface ResourceBarProps {
  initiatives: Initiative[];
  capabilities: Capability[];
}

export function ResourceBar({ initiatives, capabilities }: ResourceBarProps) {
  const { t } = useTranslation();
  const { pct, color, bgColor, activeCount, totalCount } = useMemo(() => {
    if (initiatives.length === 0) return { pct: 0, color: '#64748b', bgColor: '#f1f5f9', activeCount: 0, totalCount: 0 };

    const active = initiatives.filter(i =>
      i.status === 'active' || (!i.status && i.horizon === 'near')
    );
    const total = initiatives.length;
    const activeN = active.length;

    // Activity ratio as resource indicator
    const activityRatio = total > 0 ? activeN / Math.max(total, 3) : 0;
    const combined = activityRatio;

    const clamped = Math.min(combined, 1);
    const p = Math.round(clamped * 100);
    const c = clamped > 0.8 ? '#dc2626' : clamped >= 0.6 ? '#f59e0b' : '#22c55e';
    const bg = clamped > 0.8 ? '#fef2f2' : clamped >= 0.6 ? '#fffbeb' : '#f0fdf4';

    return { pct: p, color: c, bgColor: bg, activeCount: activeN, totalCount: total };
  }, [initiatives, capabilities]);

  if (initiatives.length === 0) return null;

  return (
    <div
      className="relative w-full mt-2 px-1"
      title={t('resourceBar.tooltip', { active: activeCount, total: totalCount, pct })}
    >
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
