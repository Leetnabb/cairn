import { useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSIONS } from '../../types';
import type { DimensionKey } from '../../types';
import { Button } from '../ui/Button';

export function FilterDropdown() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const open = useStore(s => s.ui.filterDropdownOpen);
  const setOpen = useStore(s => s.setFilterDropdownOpen);
  const filters = useStore(s => s.ui.filters);
  const setFilter = useStore(s => s.setFilter);
  const resetFilters = useStore(s => s.resetFilters);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);

  const owners = useMemo(() => {
    const set = new Set(initiatives.map(i => i.owner));
    return Array.from(set).sort();
  }, [initiatives]);

  const hasFilters = filters.dimensions.length > 0 || filters.horizon !== 'all' || filters.owner || filters.search || filters.status || filters.focusMode;

  const toggleDimension = (key: DimensionKey) => {
    const dims = filters.dimensions.includes(key)
      ? filters.dimensions.filter(d => d !== key)
      : [...filters.dimensions, key];
    setFilter({ dimensions: dims });
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-7 h-7 flex items-center justify-center text-text-secondary hover:bg-gray-100 rounded transition-colors"
        title={t('filters.title')}
        aria-label={t('filters.title')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {hasFilters && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg p-3 w-[280px] z-50 space-y-3">
          {/* Dimension toggles */}
          <div>
            <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('filters.dimension')}</div>
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
          </div>

          {/* Horizon toggle */}
          <div>
            <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('labels.horizon.label')}</div>
            <div className="flex gap-0.5">
              {[['all', t('labels.horizon.all')], ['near', t('labels.horizon.near')], ['far', t('labels.horizon.far')]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter({ horizon: val as 'all' | 'near' | 'far' })}
                  className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                    filters.horizon === val ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles row */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter({ showMilestones: !filters.showMilestones })}
              className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                filters.showMilestones ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-gray-100'
              }`}
            >
              {t('filters.milestones')}
            </button>
            <button
              onClick={() => setFilter({ focusMode: !filters.focusMode })}
              className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                filters.focusMode ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-gray-100'
              }`}
            >
              {t('filters.focus')}
            </button>
          </div>

          {/* Zoom controls */}
          {filters.focusMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter({ zoomLevel: Math.max(0.5, (filters.zoomLevel ?? 1) - 0.25) })}
                className="px-1.5 py-0.5 text-[9px] rounded hover:bg-gray-100 text-text-tertiary"
              >
                -
              </button>
              <span className="px-1 text-[9px] text-text-tertiary min-w-[28px] text-center">
                {Math.round((filters.zoomLevel ?? 1) * 100)}%
              </span>
              <button
                onClick={() => setFilter({ zoomLevel: Math.min(3, (filters.zoomLevel ?? 1) + 0.25) })}
                className="px-1.5 py-0.5 text-[9px] rounded hover:bg-gray-100 text-text-tertiary"
              >
                +
              </button>
            </div>
          )}

          {/* Owner dropdown */}
          <div>
            <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('common.owner')}</div>
            <select
              value={filters.owner}
              onChange={e => setFilter({ owner: e.target.value })}
              className="w-full px-2 py-0.5 text-[10px] border border-border rounded focus:outline-none focus:border-primary"
            >
              <option value="">{t('filters.allOwners')}</option>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('labels.status.label')}</div>
            <select
              value={filters.status}
              onChange={e => setFilter({ status: e.target.value as '' | 'planned' | 'in_progress' | 'done' })}
              className="w-full px-2 py-0.5 text-[10px] border border-border rounded focus:outline-none focus:border-primary"
            >
              <option value="">{t('filters.allStatuses')}</option>
              <option value="planned">{t('labels.status.planned')}</option>
              <option value="in_progress">{t('labels.status.in_progress')}</option>
              <option value="done">{t('labels.status.done')}</option>
            </select>
          </div>

          {/* Search */}
          <input
            value={filters.search}
            onChange={e => setFilter({ search: e.target.value })}
            placeholder={t('common.search')}
            className="w-full px-2 py-1 text-[10px] border border-border rounded focus:outline-none focus:border-primary"
          />

          {/* Reset */}
          {hasFilters && (
            <div className="pt-1 border-t border-border">
              <Button variant="ghost" onClick={resetFilters}>{t('common.reset')}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
