import { useTranslation } from 'react-i18next';
import { DIMENSIONS } from '../../types';
import type { Initiative } from '../../types';

interface Props {
  initiatives: Initiative[];
}

export function DimensionHealth({ initiatives }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {DIMENSIONS.map(dim => {
        const dimInits = initiatives.filter(i => i.dimension === dim.key);
        return (
          <div key={dim.key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dim.color }} />
            <span className="text-[10px] w-20 truncate shrink-0" style={{ color: dim.textColor }}>
              {t(`labels.dimensions.${dim.key}`)}
            </span>
            <div className="flex gap-0.5 flex-1 flex-wrap">
              {dimInits.map(init => (
                <div
                  key={init.id}
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor: init.status === 'done' ? '#22c55e' : init.status === 'in_progress' ? '#3b82f6' : '#d1d5db',
                  }}
                  title={`${init.name} (${t(`labels.status.${init.status ?? 'planned'}`)})`}
                />
              ))}
              {dimInits.length === 0 && (
                <span className="text-[9px] text-text-tertiary italic">{t('common.none')}</span>
              )}
            </div>
            <span className="text-[9px] text-text-tertiary w-4 text-right shrink-0">{dimInits.length}</span>
          </div>
        );
      })}
    </div>
  );
}
