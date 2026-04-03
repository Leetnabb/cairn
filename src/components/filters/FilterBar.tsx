import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSIONS } from '../../types';
import type { DimensionKey, Horizon } from '../../types';
import { Button } from '../ui/Button';

export function FilterBar() {
  const { t } = useTranslation();
  const filters = useStore(s => s.ui.filters);
  const setFilter = useStore(s => s.setFilter);
  const resetFilters = useStore(s => s.resetFilters);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);

  const owners = useMemo(() => {
    const set = new Set(initiatives.map(i => i.owner));
    return Array.from(set).sort();
  }, [initiatives]);

  const hasFilters = filters.dimensions.length > 0 || filters.horizon !== 'all' || filters.owner || filters.search || filters.status || !filters.showMilestones || filters.focusMode;

  const toggleDimension = (key: DimensionKey) => {
    const dims = filters.dimensions.includes(key)
      ? filters.dimensions.filter(d => d !== key)
      : [...filters.dimensions, key];
    setFilter({ dimensions: dims });
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-card border-b border-border shrink-0">
      {/* Dimension toggles */}
      <div className="flex gap-0.5">
        {DIMENSIONS.map(d => (
          <button
            key={d.key}
            onClick={() => toggleDimension(d.key)}
            className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-all duration-150 ${
              filters.dimensions.length === 0 || filters.dimensions.includes(d.key)
                ? 'text-white'
                : 'border border-border text-text-tertiary opacity-50'
            }`}
            style={
              filters.dimensions.length === 0 || filters.dimensions.includes(d.key)
                ? { backgroundColor: d.color }
                : undefined
            }
          >
            {t(`labels.dimensions.${d.key}`)}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Horizon toggle */}
      <div className="flex gap-0.5">
        {[['all', t('labels.horizon.all')], ['near', t('labels.horizon.near')], ['far', t('labels.horizon.far')]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter({ horizon: val as 'all' | Horizon })}
            className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
              filters.horizon === val ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-[var(--bg-hover)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Milestone toggle */}
      <button
        onClick={() => setFilter({ showMilestones: !filters.showMilestones })}
        className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
          filters.showMilestones ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-[var(--bg-hover)]'
        }`}
      >
        {t('filters.milestones')}
      </button>

      {/* Focus mode toggle */}
      <button
        onClick={() => setFilter({ focusMode: !filters.focusMode })}
        className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
          filters.focusMode ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-[var(--bg-hover)]'
        }`}
      >
        {t('filters.focus')}
      </button>

      {/* Zoom controls */}
      {filters.focusMode && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setFilter({ zoomLevel: Math.max(0.5, (filters.zoomLevel ?? 1) - 0.25) })}
            className="px-1.5 py-0.5 text-[9px] rounded hover:bg-[var(--bg-hover)] text-text-tertiary"
          >
            −
          </button>
          <span className="px-1 text-[9px] text-text-tertiary min-w-[28px] text-center">
            {Math.round((filters.zoomLevel ?? 1) * 100)}%
          </span>
          <button
            onClick={() => setFilter({ zoomLevel: Math.min(3, (filters.zoomLevel ?? 1) + 0.25) })}
            className="px-1.5 py-0.5 text-[9px] rounded hover:bg-[var(--bg-hover)] text-text-tertiary"
          >
            +
          </button>
        </div>
      )}

      <div className="w-px h-4 bg-border" />

      {/* Owner dropdown */}
      <select
        value={filters.owner}
        onChange={e => setFilter({ owner: e.target.value })}
        className="px-2 py-0.5 text-[10px] border border-border rounded focus:outline-none focus:border-primary"
      >
        <option value="">{t('filters.allOwners')}</option>
        {owners.map(o => <option key={o} value={o}>{o}</option>)}
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={e => setFilter({ status: e.target.value as '' | 'idea' | 'planned' | 'active' | 'done' | 'stopped' | 'pivoted' })}
        className="px-2 py-0.5 text-[10px] border border-border rounded focus:outline-none focus:border-primary"
      >
        <option value="">{t('filters.allStatuses')}</option>
        <option value="idea">{t('labels.status.idea')}</option>
        <option value="planned">{t('labels.status.planned')}</option>
        <option value="active">{t('labels.status.active')}</option>
        <option value="done">{t('labels.status.done')}</option>
        <option value="stopped">{t('labels.status.stopped')}</option>
        <option value="pivoted">{t('labels.status.pivoted')}</option>
      </select>

      {/* Search */}
      <input
        value={filters.search}
        onChange={e => setFilter({ search: e.target.value })}
        placeholder={t('common.search')}
        className="px-2 py-0.5 text-[10px] border border-border rounded w-32 focus:outline-none focus:border-primary"
      />

      {/* Reset */}
      {hasFilters && (
        <Button variant="ghost" onClick={resetFilters}>{t('common.reset')}</Button>
      )}
    </div>
  );
}
