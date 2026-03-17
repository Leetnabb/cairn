import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import type { EffectType } from '../../types';
import { EffectDropZone } from './EffectDropZone';

const EFFECT_TYPES: EffectType[] = ['cost', 'quality', 'speed', 'compliance', 'strategic'];

export function EffectBoard() {
  const { t } = useTranslation();
  const effects = useStore(s => s.effects);

  const effectsByType = Object.fromEntries(
    EFFECT_TYPES.map(type => [type, effects.filter(e => e.type === type)])
  ) as Record<EffectType, typeof effects>;

  return (
    <div className="h-full flex flex-col overflow-hidden p-4">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <h1 className="text-[14px] font-bold text-text-primary">{t('effectBoard.title')}</h1>
        <span className="text-[10px] text-text-tertiary">
          {effects.length} {t('effectBoard.total')}
        </span>
      </div>

      {effects.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <p className="text-[12px] text-text-tertiary">{t('effectBoard.emptyBoard')}</p>
        </div>
      ) : (
        <div className="flex gap-3 flex-1 overflow-x-auto overflow-y-hidden">
          {EFFECT_TYPES.map(type => (
            <div key={type} className="flex flex-col w-[200px] shrink-0">
              <EffectDropZone type={type} effects={effectsByType[type]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
