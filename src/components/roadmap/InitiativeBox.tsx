import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { DIMENSION_MAP } from '../../types';
import type { Initiative } from '../../types';

interface Props {
  initiative: Initiative;
  isOnCriticalPath?: boolean;
  criticalPathEnabled?: boolean;
  isDependency?: boolean;
  isDependent?: boolean;
  opacity?: number;
  strategyNames?: string[];
}

export function InitiativeBox({ initiative, isOnCriticalPath, criticalPathEnabled, isDependency, isDependent, opacity = 1, strategyNames }: Props) {
  const { t } = useTranslation();
  const selectedItem = useStore(s => s.ui.selectedItem);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const updateInitiative = useStore(s => s.updateInitiative);
  const selectedItems = useStore(s => s.ui.selectedItems);
  const toggleSelectedItem = useStore(s => s.toggleSelectedItem);
  const roleMode = useStore(s => s.ui.roleMode);

  const dim = DIMENSION_MAP[initiative.dimension];
  const isSelected = selectedItem?.type === 'initiative' && selectedItem.id === initiative.id;
  const isMultiSelected = selectedItems.has(initiative.id);
  const confidence = initiative.confidence ?? 'confirmed';
  const isTentative = confidence === 'tentative';
  const isUnderConsideration = confidence === 'under_consideration';
  const capCount = initiative.capabilities.length;
  const depCount = initiative.dependsOn.length;
  const override = initiative.criticalPathOverride;
  const isGovernance = roleMode === 'governance';

  const handleCriticalPathToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Cycle: auto (null) → pinned (true) → excluded (false) → auto (null)
    const next = override == null ? true : override === true ? false : null;
    updateInitiative(initiative.id, { criticalPathOverride: next });
  };

  return (
    <div
      draggable={!isGovernance}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', initiative.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => {
        if (!isGovernance && (e.ctrlKey || e.metaKey)) {
          toggleSelectedItem(initiative.id);
        } else {
          setSelectedItem({ type: 'initiative', id: initiative.id });
        }
      }}
      className={`relative min-w-[120px] px-2 py-1.5 rounded cursor-grab active:cursor-grabbing transition-all duration-150 group border ${
        isMultiSelected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300'
          : isSelected
          ? 'border-primary shadow-selected ring-1 ring-primary/20'
          : isDependency
          ? 'border-yellow-300 bg-yellow-50'
          : isDependent
          ? 'border-blue-300 bg-blue-50'
          : isTentative
          ? 'border-dashed border-border bg-white hover:shadow-hover'
          : isUnderConsideration
          ? 'border-dotted border-border bg-white hover:shadow-hover'
          : 'border-border bg-white hover:shadow-hover'
      } ${isOnCriticalPath ? 'ring-2 ring-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : ''}`}
      style={{
        borderLeftWidth: 3,
        borderLeftStyle: isTentative ? 'dashed' : isUnderConsideration ? 'dotted' : 'solid',
        borderLeftColor: dim.color,
        opacity: isUnderConsideration
          ? Math.min(opacity, 0.6)
          : isTentative
          ? Math.min(opacity, 0.8)
          : initiative.status === 'done' ? Math.min(opacity, 0.7) : opacity,
      }}
    >
      {/* Critical path quick-toggle */}
      {criticalPathEnabled && (
        <button
          onClick={handleCriticalPathToggle}
          className={`absolute -top-1.5 left-3 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] leading-none z-10 border transition-opacity duration-150 ${
            override != null ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${
            override === true
              ? 'bg-red-100 border-red-400 text-red-600'
              : override === false
              ? 'bg-gray-100 border-gray-400 text-gray-500'
              : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
          }`}
          title={override === true ? t('detail.criticalPath.pinnedTooltip') : override === false ? t('detail.criticalPath.excludedTooltip') : t('detail.criticalPath.autoTooltip')}
        >
          {override === true ? '\ud83d\udccc' : override === false ? '\u2715' : '\u00b7'}
        </button>
      )}
      {/* Multi-select checkbox */}
      {isMultiSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] z-10">✓</div>
      )}
      <div className={`text-[10px] font-medium leading-tight truncate ${isUnderConsideration ? 'italic' : ''}`} title={initiative.name}>{initiative.name}</div>
      <div className="text-[8px] text-text-tertiary truncate mt-0.5" title={initiative.owner}>{initiative.owner}</div>
      {/* Compact info line */}
      <div className="text-[8px] text-text-tertiary mt-0.5">
        {capCount > 0 && <span>{capCount} kap</span>}
        {capCount > 0 && depCount > 0 && <span> &middot; </span>}
        {depCount > 0 && <span>{depCount} dep</span>}
      </div>
    </div>
  );
}
