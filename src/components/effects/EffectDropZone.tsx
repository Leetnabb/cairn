import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Effect, EffectType } from '../../types';
import { EFFECT_TYPE_COLORS, EFFECT_TYPE_LABELS } from '../../types';
import { useStore } from '../../stores/useStore';
import { EffectCard } from './EffectCard';

interface Props {
  type: EffectType;
  effects: Effect[];
}

export function EffectDropZone({ type, effects }: Props) {
  const moveEffect = useStore(s => s.moveEffect);
  const setAddModalOpen = useStore(s => s.setAddModalOpen);
  const { t } = useTranslation();
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);

  const color = EFFECT_TYPE_COLORS[type];
  const sorted = [...effects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(idx);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id && dropIndex !== null) {
      moveEffect(id, type, dropIndex);
    }
    setDropIndex(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropIndex(null);
    }
  };

  return (
    <div className="flex flex-col min-w-0 flex-1">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-2 py-1.5 mb-2 rounded text-[10px] font-semibold"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <span>{EFFECT_TYPE_LABELS[type]}</span>
        <span className="text-[9px] opacity-70">{effects.length}</span>
      </div>

      {/* Drop area */}
      <div
        className="relative flex-1 min-h-[60px] flex flex-col gap-1 p-1 rounded transition-colors duration-150 group/zone"
        style={{ backgroundColor: dropIndex !== null ? `${color}10` : 'transparent' }}
        onDragOver={(e) => handleDragOver(e, sorted.length)}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {sorted.map((effect, idx) => (
          <div
            key={effect.id}
            onDragOver={(e) => {
              e.stopPropagation();
              handleDragOver(e, idx);
            }}
          >
            {dropIndex === idx && (
              <div className="h-0.5 rounded mb-0.5" style={{ backgroundColor: color }} />
            )}
            <EffectCard effect={effect} />
          </div>
        ))}
        {dropIndex === sorted.length && (
          <div className="h-0.5 rounded" style={{ backgroundColor: color }} />
        )}
        {sorted.length === 0 && dropIndex === null && (
          <p className="text-[9px] text-text-tertiary italic px-1 py-2">
            {t('effectBoard.empty')}
          </p>
        )}
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); setAddModalOpen(true, 'effect'); }}
            className="absolute top-0.5 right-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold leading-none opacity-0 group-hover/zone:opacity-100 transition-opacity duration-150 hover:scale-110"
            style={{ backgroundColor: `${color}20`, color }}
            title={t('effectBoard.addEffect')}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
