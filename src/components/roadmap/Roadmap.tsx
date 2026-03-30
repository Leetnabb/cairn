import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSIONS } from '../../types';
import type { DimensionKey, Initiative, Horizon } from '../../types';
import { DropZone } from './DropZone';
import { MilestoneMarker } from './MilestoneMarker';
import { getMergedCriticalPath } from '../../lib/criticalPath';
import { CapabilityPath } from './CapabilityPath';

export function Roadmap() {
  const { t } = useTranslation();
  const activeScenario = useStore(s => s.activeScenario);
  const initiatives = useStore(s => activeScenario ? s.scenarioStates[activeScenario]?.initiatives ?? EMPTY_INITIATIVES : EMPTY_INITIATIVES);
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
  const roadmapViewMode = useStore(s => s.ui.roadmapViewMode);
  const setRoadmapViewMode = useStore(s => s.setRoadmapViewMode);
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

  const getInitiativesForZone = (dim: DimensionKey, horizon: Horizon) =>
    initiatives.filter(i => i.dimension === dim && i.horizon === horizon);

  const nearMilestones = milestones.filter(m => m.horizon === 'near');
  const farMilestones = milestones.filter(m => m.horizon === 'far');

  const setFilter = useStore(s => s.setFilter);

  const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const stepZoom = useCallback((direction: 'in' | 'out') => {
    const current = filters.zoomLevel ?? 1;
    const currentIdx = ZOOM_STEPS.findIndex(s => s >= current);
    const idx = direction === 'in'
      ? Math.min((currentIdx === -1 ? ZOOM_STEPS.length - 1 : currentIdx) + 1, ZOOM_STEPS.length - 1)
      : Math.max((currentIdx === -1 ? 0 : currentIdx) - 1, 0);
    setFilter({ zoomLevel: ZOOM_STEPS[idx] });
  }, [filters.zoomLevel, setFilter]);

  // Keyboard shortcuts for zoom (works always in roadmap view)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        stepZoom('in');
      } else if (e.key === '-') {
        e.preventDefault();
        stepZoom('out');
      } else if (e.key === '0') {
        e.preventDefault();
        setFilter({ zoomLevel: 1 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepZoom, setFilter]);

  // Ctrl+Scroll zoom handler
  const roadmapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        stepZoom(e.deltaY < 0 ? 'in' : 'out');
      }
    };
    const el = roadmapRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [stepZoom]);

  const focusMode = filters.focusMode;
  const showNear = !(focusMode && filters.horizon !== 'near' && filters.horizon !== 'all');
  const showFar = !(focusMode && filters.horizon !== 'far' && filters.horizon !== 'all');
  const visibleColCount = [showNear, showFar].filter(Boolean).length;
  const gridCols = visibleColCount === 2 ? '120px 1fr 1fr' : '120px 1fr';

  const visibleDimensions = useMemo(
    () => focusMode && filters.dimensions.length > 0
      ? DIMENSIONS.filter(d => filters.dimensions.includes(d.key))
      : DIMENSIONS,
    [focusMode, filters.dimensions]
  );

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

  if (roadmapViewMode === 'capability') {
    return (
      <div className="min-h-full">
        {/* View toggle */}
        <div className="flex items-center gap-1 px-3 pt-3 pb-1">
          <button
            onClick={() => setRoadmapViewMode('dimension')}
            className="px-2 py-0.5 rounded text-[10px] border border-border bg-card text-text-secondary hover:bg-[var(--bg-hover)]"
          >
            {t('strategyPath.dimView')}
          </button>
          <button
            className="px-2 py-0.5 rounded text-[10px] border border-primary bg-primary text-white"
          >
            {t('strategyPath.capView')}
          </button>
        </div>
        <CapabilityPath />
      </div>
    );
  }

  return (
    <div ref={roadmapRef} className={focusMode ? "h-full p-3 flex flex-col" : "min-h-full p-3"} onClick={handleBackgroundClick}>
      {/* View toggle */}
      <div className="flex items-center gap-1 mb-2">
        <button
          className="px-2 py-0.5 rounded text-[10px] border border-primary bg-primary text-white"
        >
          {t('strategyPath.dimView')}
        </button>
        <button
          onClick={() => setRoadmapViewMode('capability')}
          className="px-2 py-0.5 rounded text-[10px] border border-border bg-card text-text-secondary hover:bg-[var(--bg-hover)]"
        >
          {t('strategyPath.capView')}
        </button>
      </div>
      {/* Empty state */}
      {initiatives.length === 0 && !hasActiveFilters && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[13px] font-medium text-text-secondary mb-1">{t('roadmap.emptyTitle')}</p>
          <p className="text-[11px] text-text-tertiary">{t('roadmap.emptyBody')}</p>
        </div>
      )}

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
              role="button"
              tabIndex={0}
              className="grid mb-1 cursor-pointer"
              style={{ gridTemplateColumns: gridCols, gap: '4px', opacity: dimOpacity }}
              onClick={() => toggleCollapse(dim.key)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleCollapse(dim.key)}
              aria-label={`${t(`labels.dimensions.${dim.key}`)} – ${t('roadmap.expand')}`}
              aria-expanded={false}
            >
              <div
                className="flex items-center px-2 rounded text-[10px] font-semibold"
                style={{ backgroundColor: dim.bgColor, color: dim.textColor, height: 24 }}
              >
                <div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: dim.color }} aria-hidden="true" />
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
              role="button"
              tabIndex={0}
              className="flex items-center px-2 py-1 rounded text-[11px] font-semibold cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: dim.bgColor,
                color: dim.textColor,
              }}
              onClick={() => toggleCollapse(dim.key)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleCollapse(dim.key)}
              aria-label={`${t(`labels.dimensions.${dim.key}`)} – ${t('roadmap.collapsed')}`}
              aria-expanded={true}
            >
              <div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: dim.color }} aria-hidden="true" />
              {t(`labels.dimensions.${dim.key}`)}
            </div>

            {/* Near horizon — stronger colors */}
            {showNear && (
              <div
                className={`relative rounded ${focusMode ? 'h-full overflow-auto' : ''}`}
                style={{
                  backgroundColor: dim.bgColor,
                  borderLeft: `3px solid ${dim.color}`,
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-card rounded-lg shadow-lg border border-border">
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
              <div className="absolute bottom-full mb-1 left-0 bg-card border border-border rounded shadow-lg p-2 min-w-[160px]">
                {DIMENSIONS.map(dim => (
                  <div key={dim.key} className="mb-1">
                    <div className="text-[9px] text-text-tertiary uppercase px-1">{t(`labels.dimensions.${dim.key}`)}</div>
                    <button
                      onClick={() => { bulkMoveInitiatives([...selectedItems], dim.key, 'near'); setShowMoveDropdown(false); }}
                      className="block w-full text-left px-2 py-0.5 text-[10px] rounded hover:bg-[var(--bg-hover)]"
                    >
                      {t('labels.horizon.near')}
                    </button>
                    <button
                      onClick={() => { bulkMoveInitiatives([...selectedItems], dim.key, 'far'); setShowMoveDropdown(false); }}
                      className="block w-full text-left px-2 py-0.5 text-[10px] rounded hover:bg-[var(--bg-hover)]"
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
            className="px-3 py-1 text-[11px] rounded border border-border hover:bg-[var(--bg-hover)]"
          >
            {t('bulk.cancel')}
          </button>
        </div>
      )}

      {/* Zoom indicator */}
      {zoomLevel !== 1 && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-md px-3 py-1.5 text-[11px] text-text-secondary shadow-md z-20">
          {t('zoom.indicator', { level: Math.round(zoomLevel * 100) })}
        </div>
      )}
    </div>
  );
}
