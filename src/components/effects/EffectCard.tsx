import type { Effect } from '../../types';
import { EFFECT_TYPE_COLORS } from '../../types';
import { useStore } from '../../stores/useStore';

interface Props {
  effect: Effect;
}

export function EffectCard({ effect }: Props) {
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const selectedItem = useStore(s => s.ui.selectedItem);
  const isSelected = selectedItem?.type === 'effect' && selectedItem.id === effect.id;
  const color = EFFECT_TYPE_COLORS[effect.type];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', effect.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => setSelectedItem({ type: 'effect', id: effect.id })}
      className={`bg-white border rounded shadow-card cursor-pointer select-none transition-all duration-150 hover:shadow-hover ${
        isSelected ? 'border-primary shadow-selected' : 'border-border'
      }`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="px-2 py-1.5">
        <p className="text-[11px] font-medium leading-tight text-text-primary truncate">{effect.name}</p>
        {effect.indicator && (
          <p className="text-[9px] text-text-tertiary mt-0.5 truncate">
            {effect.indicator}
            {effect.baseline && effect.target && (
              <span className="ml-1">{effect.baseline} → {effect.target}</span>
            )}
          </p>
        )}
        {(effect.capabilities.length > 0 || effect.initiatives.length > 0) && (
          <div className="flex gap-1.5 mt-1">
            {effect.capabilities.length > 0 && (
              <span className="text-[8px] text-text-tertiary bg-gray-100 px-1 py-0.5 rounded-full leading-none">
                {effect.capabilities.length} cap
              </span>
            )}
            {effect.initiatives.length > 0 && (
              <span className="text-[8px] text-text-tertiary bg-gray-100 px-1 py-0.5 rounded-full leading-none">
                {effect.initiatives.length} init
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
