import { useState } from 'react';
import type { DimensionKey, Initiative } from '../../types';
import { DIMENSION_MAP } from '../../types';
import { useStore } from '../../stores/useStore';
import { InitiativeBox } from './InitiativeBox';

interface Props {
  dimension: DimensionKey;
  horizon: 'near' | 'far';
  initiatives: Initiative[];
  criticalPathIds?: Set<string>;
  criticalPathEnabled?: boolean;
  selectedDeps?: { upstream: Set<string>; downstream: Set<string> };
  filterOpacity?: (i: Initiative) => number;
  fillHeight?: boolean;
}

export function DropZone({ dimension, horizon, initiatives, criticalPathIds, criticalPathEnabled, selectedDeps, filterOpacity, fillHeight }: Props) {
  const moveInitiative = useStore(s => s.moveInitiative);
  const setAddModalOpen = useStore(s => s.setAddModalOpen);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);

  const dim = DIMENSION_MAP[dimension];
  const sorted = [...initiatives].sort((a, b) => a.order - b.order);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(idx);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id && dropIndex !== null) {
      moveInitiative(id, dimension, horizon, dropIndex);
    }
    setDropIndex(null);
  };

  const handleDragLeave = () => setDropIndex(null);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddModalOpen(true, 'initiative', { dimension, horizon });
  };

  return (
    <div
      className={`relative flex-1 min-h-[40px] p-1 flex flex-wrap gap-1 items-start content-start rounded transition-colors duration-150 group/zone ${fillHeight ? 'h-full' : ''}`}
      style={{ backgroundColor: dropIndex !== null ? dim.bgLight : 'transparent' }}
      onDragOver={(e) => handleDragOver(e, sorted.length)}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {sorted.map((init, idx) => (
        <div
          key={init.id}
          className="flex items-start"
          onDragOver={(e) => {
            e.stopPropagation();
            handleDragOver(e, idx);
          }}
        >
          {dropIndex === idx && (
            <div className="w-0.5 h-8 rounded mr-0.5 shrink-0" style={{ backgroundColor: dim.color }} />
          )}
          <InitiativeBox
            initiative={init}
            isOnCriticalPath={criticalPathIds?.has(init.id)}
            criticalPathEnabled={criticalPathEnabled}
            isDependency={selectedDeps?.upstream.has(init.id)}
            isDependent={selectedDeps?.downstream.has(init.id)}
            opacity={filterOpacity ? filterOpacity(init) : 1}
          />
        </div>
      ))}
      {dropIndex === sorted.length && (
        <div className="w-0.5 h-8 rounded" style={{ backgroundColor: dim.color }} />
      )}
      {sorted.length === 0 && dropIndex === null && (
        <div className="text-[9px] text-text-tertiary italic px-1 py-2">
          Dra aktiviteter hit
        </div>
      )}
      {hovered && (
        <button
          onClick={handleQuickAdd}
          className="absolute top-0.5 right-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold leading-none opacity-0 group-hover/zone:opacity-100 transition-opacity duration-150 hover:scale-110"
          style={{ backgroundColor: dim.bgColor, color: dim.textColor }}
          title="Ny aktivitet"
        >
          +
        </button>
      )}
    </div>
  );
}
