import { useStore } from '../../stores/useStore';
import type { Milestone } from '../../types';

interface Props {
  milestone: Milestone;
}

export function MilestoneMarker({ milestone }: Props) {
  const setSelectedItem = useStore(s => s.setSelectedItem);

  return (
    <div
      className="absolute top-0 bottom-0 flex flex-col items-center cursor-pointer z-10"
      style={{ left: `${milestone.position * 100}%` }}
      onClick={(e) => { e.stopPropagation(); setSelectedItem({ type: 'milestone', id: milestone.id }); }}
    >
      <div
        className="px-1.5 py-0.5 rounded text-[8px] font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: milestone.color }}
      >
        {milestone.name}
      </div>
      <div
        className="flex-1 w-px border-l border-dashed"
        style={{ borderColor: milestone.color }}
      />
    </div>
  );
}
