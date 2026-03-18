import { describe, it, expect } from 'vitest';
import { COMPLEXITY_FEATURES } from '../types';

describe('COMPLEXITY_FEATURES', () => {
  it('level 1 shows only roadmap and dashboard views', () => {
    expect(COMPLEXITY_FEATURES[1].views).toEqual(['roadmap', 'dashboard']);
  });

  it('level 2 adds capabilities, effects, strategies', () => {
    expect(COMPLEXITY_FEATURES[2].views).toContain('capabilities');
    expect(COMPLEXITY_FEATURES[2].views).toContain('effects');
    expect(COMPLEXITY_FEATURES[2].views).toContain('strategies');
  });

  it('level 3 adds compare view', () => {
    expect(COMPLEXITY_FEATURES[3].views).toContain('compare');
  });

  it('level 1 filters are limited to dimensions and search', () => {
    expect(COMPLEXITY_FEATURES[1].filters).toEqual(['dimensions', 'search']);
  });

  it('level 3 features include simulation and critical path', () => {
    expect(COMPLEXITY_FEATURES[3].features).toContain('simulation');
    expect(COMPLEXITY_FEATURES[3].features).toContain('criticalPath');
  });
});
