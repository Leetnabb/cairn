import { useStore } from '../stores/useStore';
import { COMPLEXITY_FEATURES, type ViewMode } from '../types';

export function useComplexityLevel() {
  const level = useStore(s => s.ui.complexityLevel);
  const config = COMPLEXITY_FEATURES[level];

  return {
    level,
    isViewVisible: (view: ViewMode) => config.views.includes(view),
    isFilterVisible: (filter: string) => config.filters.includes(filter),
    isFeatureEnabled: (feature: string) => config.features.includes(feature),
  };
}
