import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative } from '../../types';
import { getMergedCriticalPath } from '../../lib/criticalPath';

interface Props {
  initiatives: Initiative[];
}

export function CriticalPathNarrative({ initiatives }: Props) {
  const { t } = useTranslation();

  const pathItems = useMemo(() => {
    const { merged } = getMergedCriticalPath(initiatives);
    if (merged.size === 0) return [];
    // Order by dependency chain
    const initMap = new Map(initiatives.map(i => [i.id, i]));
    const items = Array.from(merged).map(id => initMap.get(id)).filter(Boolean) as Initiative[];
    // Sort by dependency order (items with no deps first)
    const sorted: Initiative[] = [];
    const remaining = new Set(items.map(i => i.id));
    while (remaining.size > 0) {
      const next = items.find(i => remaining.has(i.id) && i.dependsOn.every(d => !remaining.has(d) || !merged.has(d)));
      if (!next) break;
      sorted.push(next);
      remaining.delete(next.id);
    }
    // Add any remaining (cycles)
    for (const id of remaining) {
      const i = initMap.get(id);
      if (i) sorted.push(i);
    }
    return sorted;
  }, [initiatives]);

  if (pathItems.length === 0) {
    return <p className="text-[10px] text-text-tertiary italic">{t('common.none')}</p>;
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {pathItems.map((item, idx) => (
        <div key={item.id} className="flex items-center shrink-0">
          <div className="px-2 py-1 rounded bg-red-50 border border-red-200 text-[9px] font-medium text-red-800 whitespace-nowrap">
            {item.name}
          </div>
          {idx < pathItems.length - 1 && (
            <svg width="16" height="12" viewBox="0 0 16 12" className="text-red-300 shrink-0 mx-0.5">
              <path d="M0 6h12l-4-4M12 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
