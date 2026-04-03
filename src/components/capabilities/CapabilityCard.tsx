import { useStore } from '../../stores/useStore';
import type { Capability } from '../../types';
import { MATURITY_COLORS, RISK_COLORS } from '../../types';

interface Props {
  capability: Capability;
  isHighlighted?: boolean;
  simulatedMaturity?: number;
  improved?: boolean;
}

export function CapabilityCard({ capability, isHighlighted, simulatedMaturity, improved }: Props) {
  const selectedItem = useStore(s => s.ui.selectedItem);
  const capabilityView = useStore(s => s.ui.capabilityView);
  const setSelectedItem = useStore(s => s.setSelectedItem);

  const isSelected = selectedItem?.type === 'capability' && selectedItem.id === capability.id;
  const displayMaturity = simulatedMaturity ?? capability.maturity;
  const indicatorColor = capabilityView === 'maturity'
    ? MATURITY_COLORS[displayMaturity]
    : RISK_COLORS[capability.risk];

  return (
    <div
      onClick={() => setSelectedItem({ type: 'capability', id: capability.id })}
      className={`px-2 py-1.5 rounded cursor-pointer border transition-all duration-150 ${
        isSelected
          ? 'border-primary shadow-selected'
          : isHighlighted
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card hover:shadow-hover'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-medium leading-tight truncate" title={capability.name}>{capability.name}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicatorColor }} />
          {improved && <span className="text-[9px] text-green-600">▲</span>}
        </div>
      </div>
    </div>
  );
}
