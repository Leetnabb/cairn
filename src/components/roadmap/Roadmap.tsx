import { useMemo, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSIONS } from '../../types';
import type { DimensionKey, Initiative } from '../../types';
import { DropZone } from './DropZone';
import { MilestoneMarker } from './MilestoneMarker';
import { getMergedCriticalPath } from '../../lib/criticalPath';

export function Roadmap() {
  const { t } = useTranslation();
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const milestones = useStore(s => s.milestones);
  const criticalPathEnabled = useStore(s => s.ui.criticalPathEnabled);
  const selectedItem = useStore(s => s.ui.selectedItem);
  const filters = useStore(s => s.ui.filters);
  const selectedItems = useStore(s => s.ui.selectedItems);
  const clearSelectedItems = useStore(s => s.clearSelectedItems);
  const bulkMoveInitiatives = useStore(s => s.bulkMoveInitiatives);
  const bulkDeleteInitiatives = useStore(s => s.bulkDeleteInitiatives);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const roleMode = useStore(s => s.ui.roleMode);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [collapsedDimensions, setCollapsedDimensions] = useState<Set<DimensionKey>>(new Set());

  const criticalPathIds = useMemo(() => {
    if (!criticalPathEnabled) return new Set<string>();
    const { merged } = getMergedCriticalPath(initiatives);
    return merged;
  }, [criticalPathEnabled, initiatives]);

  // Dependency highlighting for selected initiative
  const selectedDeps = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'initiative') return undefined;
    const selected = initiatives.find(i => i.id === selectedItem.id);
    if (!selected) return undefined;
    const upstream = new Set(selected.dependsOn);
    const downstream = new Set(
      initiatives.filter(i => i.dependsOn.includes(selectedItem.id)).map(i => i.id)
    );
    return { upstream, downstream };
  }, [selectedItem, initiatives]);

  // Value chain spotlight
  const spotlightValueChain = filters.spotlightValueChain;

  // Filter opacity function
  const getOpacity = useCallback((init: Initiative): number => {
    // Value chain spotlight takes priority
    if (spotlightValueChain && !init.valueChains.includes(spotlightValueChain)) {
      return 0.15;
    }
    let match = true;
    if (filters.dimensions.length > 0 && !filters.dimensions.includes(init.dimension)) match = false;
    if (filters.horizon !== 'all' && filters.horizon !== init.horizon) match = false;
    if (filters.owner && !init.owner.toLowerCase().includes(filters.owner.toLowerCase())) match = false;
    if (filters.search && !init.name.toLowerCase().includes(filters.search.toLowerCase()) && !init.description.toLowerCase().includes(filters.search.toLowerCase())) match = false;
    if (filters.status && (init.status ?? 'planned') !== filters.status) match = false;
    return match ? 1 : 0.2;
  }, [filters, spotlightValueChain]);

  const hasActiveFilters = filters.dimensions.length > 0 || filters.horizon !== 'all' || filters.owner || filters.search || filters.status || !!spotlightValueChain;

  const getInitiativesForZone = (dim: DimensionKey, horizon: 'near' | 'far') =>
    initiatives.filter(i => i.dimension === dim && i.horizon === horizon);

  const nearMilestones = milestones.filter(m => m.horizon === 'near');
  const farMilestones = milestones.filter(m => m.horizon === 'far');

  const setFilter = useStore(s => s.setFilter);

  // Keyboard shortcuts for zoom (only in focus mode)
  useEffect(() => {
    if (!filters.focusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        const current = filters.zoomLevel ?? 1;
        setFilter({ zoomLevel: Math.min(current + 0.1, 2) });
      } else if (e.key === '-') {
        e.preventDefault();
        const current = filters.zoomLevel ?? 1;
        setFilter({ zoomLevel: Math.max(current - 0.1, 0.5) });
      } else if (e.key === '0') {
        e.preventDefault();
        setFilter({ zoomLevel: 1 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filters.focusMode, filters.zoomLevel, setFilter]);

  const focusMode = filters.focusMode;
  const showNear = !(focusMode && filters.horizon === 'far');
  const showFar = !(focusMode && filters.horizon === 'near');
  const gridCols = showNear && showFar ? '120px 1fr 1fr' : '120px 1fr';

  const visibleDimensions = focusMode && filters.dimensions.length > 0
    ? DIMENSIONS.filter(d => filters.dimensions.includes(d.key))
    : DIMENSIONS;

  const zoomLevel = filters.zoomLevel ?? 1;

  const toggleCollapse = (key: DimensionKey) => {
    setCollapsedDimensions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Click on roadmap background to deselect
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedItem(null);
    }
  };

  return (
    <div className={focusMode ? "h-full p-3 flex flex-col" : "min-h-full p-3"} onClick={handleBackgroundClick}>
      {/* Column headers */}
      <div className={`grid mb-2 ${focusMode ? 'shrink-0' : ''}`} style={{ gridTemplateColumns: gridCols, gap: '4px' }}>
        <div />
        {showNear && (
          <div className="text-[10px] font-semibold text-text-secondary text-center px-2">
            {t('labels.horizon.nearRange')}
          </div>
        )}
        {showFar && (
          <div className="text-[10px] font-semibold text-text-secondary text-center px-2 opacity-70">
            {t('labels.horizon.farRange')}
          </div>
        )}
      </div>

      {/* Swim lanes */}
      {visibleDimensions.map(dim => {
        const dimOpacity = !focusMode && hasActiveFilters && filters.dimensions.length > 0 && !filters.dimensions.includes(dim.key) ? 0.3 : 1;
        const isCollapsed = collapsedDimensions.has(dim.key);

        if (isCollapsed) {
          return (
            <div
              key={dim.key}
              className="grid mb-1 cursor-pointer"
              style={{ gridTemplateColumns: gridCols, gap: '4px', opacity: dimOpacity }}
              onClick={() => toggleCollapse(dim.key)}
              title={t('roadmap.expand')}
            >
              <div
                className="flex items-center px-2 rounded text-[10px] font-semibold"
                style={{ backgroundColor: dim.bgColor, color: dim.textColor, height: 24 }}
              >
                <div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: dim.color }} />
                {t(`labels.dimensions.${dim.key}`)}
                <span className="ml-1 text-[8px] opacity-60">({t('roadmap.collapsed')})</span>
              </div>
              {showNear && <div className="rounded" style={{ backgroundColor: dim.bgLight, height: 24 }} />}
              {showFar && <div className="rounded" style={{ backgroundColor: dim.bgLight, height: 24, opacity: 0.7 }} />}
            </div>
          );
        }

        return (
          <div
            key={dim.key}
            className={`grid mb-1 transition-opacity duration-150 ${focusMode ? 'flex-1 min-h-0' : ''}`}
            style={{
              gridTemplateColumns: gridCols,
              ...(focusMode && { gridTemplateRows: '1fr' }),
              gap: '4px',
              opacity: dimOpacity,
            }}
          >
            {/* Label */}
            <div
              className="flex items-center px-2 py-1 rounded text-[11px] font-semibold cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: dim.bgColor,
                color: dim.textColor,
                ...(focusMode && zoomLevel !== 1 && { zoom: zoomLevel }),
              }}
              onClick={() => toggleCollapse(dim.key)}
              title={t('roadmap.collapsed')}
            >
              <div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: dim.color }} />
              {t(`labels.dimensions.${dim.key}`)}
            </div>

            {/* Near horizon — stronger colors */}
            {showNear && (
              <div
                className={`relative rounded ${focusMode ? 'h-full overflow-auto' : ''}`}
                style={{
                  backgroundColor: dim.bgColor,
                  borderLeft: `3px solid ${dim.color}`,
                  ...(focusMode && zoomLevel !== 1 && { zoom: zoomLevel }),
                }}
              >
                {filters.showMilestones && nearMilestones.map(m => (
                  <MilestoneMarker key={m.id} milestone={m} />
                ))}
                <DropZone
                  dimension={dim.key}
                  horizon="near"
                  initiatives={getInitiativesForZone(dim.key, 'near')}
                  criticalPathIds={criticalPathIds}
                  fillHeight={focusMode}
                  criticalPathEnabled={criticalPathEnabled}
                  selectedDeps={selectedDeps}
                  filterOpacity={hasActiveFilters ? getOpacity : undefined}
                />
              </div>
            )}

            {/* Far horizon — lighter/dimmer */}
            {showFar && (
              <div
                className={`relative rounded ${focusMode ? 'h-full overflow-auto' : ''}`}
                style={{
                  backgroundColor: dim.bgLight,
                  opacity: 0.7,
                  ...(focusMode && zoomLevel !== 1 && { zoom: zoomLevel }),
                }}
              >
                {filters.showMilestones && farMilestones.map(m => (
                  <MilestoneMarker key={m.id} milestone={m} />
                ))}
                <DropZone
                  dimension={dim.key}
                  horizon="far"
                  initiatives={getInitiativesForZone(dim.key, 'far')}
                  criticalPathIds={criticalPathIds}
                  fillHeight={focusMode}
                  criticalPathEnabled={criticalPathEnabled}
                  selectedDeps={selectedDeps}
                  filterOpacity={hasActiveFilters ? getOpacity : undefined}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Bulk toolbar */}
      {selectedItems.size > 0 && roleMode === 'work' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg border border-border">
          <span className="text-[11px] font-medium text-text-secondary">
            {t('bulk.selected', { count: selectedItems.size })}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMoveDropdown(!showMoveDropdown)}
              className="px-3 py-1 text-[11px] rounded bg-primary text-white hover:bg-primary/90"
            >
              {t('bulk.moveTo')}
            </button>
            {showMoveDropdown && (
              <div className="absolute bottom-full mb-1 left-0 bg-white border border-border rounded shadow-lg p-2 min-w-[160px]">
                {DIMENSIONS.map(dim => (
                  <div key={dim.key} className="mb-1">
                    <div className="text-[9px] text-text-tertiary uppercase px-1">{t(`labels.dimensions.${dim.key}`)}</div>
                    <button
                      onClick={() => { bulkMoveInitiatives([...selectedItems], dim.key, 'near'); setShowMoveDropdown(false); }}
                      className="block w-full text-left px-2 py-0.5 text-[10px] rounded hover:bg-gray-100"
                    >
                      {t('labels.horizon.near')}
                    </button>
                    <button
                      onClick={() => { bulkMoveInitiatives([...selectedItems], dim.key, 'far'); setShowMoveDropdown(false); }}
                      className="block w-full text-left px-2 py-0.5 text-[10px] rounded hover:bg-gray-100"
                    >
                      {t('labels.horizon.far')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (confirm(t('bulk.confirmDelete', { count: selectedItems.size }))) {
                bulkDeleteInitiatives([...selectedItems]);
              }
            }}
            className="px-3 py-1 text-[11px] rounded bg-red-500 text-white hover:bg-red-600"
          >
            {t('bulk.deleteSelected')}
          </button>
          <button
            onClick={() => { clearSelectedItems(); setShowMoveDropdown(false); }}
            className="px-3 py-1 text-[11px] rounded border border-border hover:bg-gray-50"
          >
            {t('bulk.cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
