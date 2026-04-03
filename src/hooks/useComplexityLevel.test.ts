import { describe, it, expect } from 'vitest';
import { COMPLEXITY_FEATURES } from '../types';

describe('COMPLEXITY_FEATURES', () => {
  it('level 1 shows roadmap, dashboard, and capabilities views', () => {
    expect(COMPLEXITY_FEATURES[1].views).toEqual(['roadmap', 'dashboard', 'capabilities']);
  });

  it('level 2 has the same three views', () => {
    expect(COMPLEXITY_FEATURES[2].views).toContain('capabilities');
    expect(COMPLEXITY_FEATURES[2].views).toContain('roadmap');
    expect(COMPLEXITY_FEATURES[2].views).toContain('dashboard');
  });

  it('level 3 has the same three views', () => {
    expect(COMPLEXITY_FEATURES[3].views).toContain('roadmap');
    expect(COMPLEXITY_FEATURES[3].views).toContain('dashboard');
    expect(COMPLEXITY_FEATURES[3].views).toContain('capabilities');
  });

  it('level 1 filters are limited to dimensions and search', () => {
    expect(COMPLEXITY_FEATURES[1].filters).toEqual(['dimensions', 'search']);
  });

  it('level 3 features include simulation and critical path', () => {
    expect(COMPLEXITY_FEATURES[3].features).toContain('simulation');
    expect(COMPLEXITY_FEATURES[3].features).toContain('criticalPath');
  });
});
