import { useTranslation } from 'react-i18next';
import type { Initiative } from '../../types';

interface Props {
  initiatives: Initiative[];
}

export function OwnerLoad({ initiatives }: Props) {
  const { t } = useTranslation();
  const ownerMap: Record<string, number> = {};
  for (const i of initiatives) {
    ownerMap[i.owner] = (ownerMap[i.owner] || 0) + 1;
  }
  const sorted = Object.entries(ownerMap).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...sorted.map(([, v]) => v), 1);

  return (
    <div className="space-y-1 relative">
      {/* Threshold indicator is shown per bar below */}
      {sorted.map(([owner, count]) => (
        <div key={owner} className="flex items-center gap-2">
          <span className="text-[10px] text-text-secondary w-24 truncate shrink-0">{owner}</span>
          <div className="flex-1 h-4 bg-[var(--bg-hover)] rounded overflow-hidden relative">
            <div
              className="h-full rounded transition-all duration-300"
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: count >= 4 ? '#ef4444' : count >= 3 ? '#f59e0b' : '#6366f1',
              }}
            />
            {/* Threshold marker inside bar */}
            {max >= 4 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-400"
                style={{ left: `${(4 / max) * 100}%` }}
                title={t('dashboard.capacityThreshold')}
              />
            )}
          </div>
          <span className={`text-[10px] font-medium w-4 text-right ${count >= 4 ? 'text-red-600' : 'text-text-secondary'}`}>
            {count}
          </span>
        </div>
      ))}
      {max >= 4 && (
        <div className="text-[8px] text-red-400 text-right">{t('dashboard.capacityThreshold')}</div>
      )}
    </div>
  );
}
