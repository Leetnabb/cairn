import { describe, it, expect } from 'vitest';
import { simulateMaturity } from '../simulation';
import type { Capability, Initiative } from '../../types';

const cap = (id: string, maturity: 1 | 2 | 3): Capability => ({
  id, name: id, level: 2, parent: null, maturity, risk: 1, description: '',
});

const init = (over: Partial<Initiative>): Initiative => ({
  id: 'i1', name: 'i', dimension: 'ledelse', horizon: 'near', order: 0,
  capabilities: [], description: '', owner: '', dependsOn: [],
  maturityEffect: {}, notes: '', valueChains: [], ...over,
});

describe('simulateMaturity', () => {
  it('projects uplift from active initiatives', () => {
    const res = simulateMaturity([cap('c1', 1)], [init({ maturityEffect: { c1: 3 } })]);
    expect(res[0].simulatedMaturity).toBe(3);
    expect(res[0].improved).toBe(true);
  });

  it('ignores stopped and pivoted initiatives (B5)', () => {
    const res = simulateMaturity(
      [cap('c1', 1)],
      [init({ status: 'stopped', maturityEffect: { c1: 3 } }), init({ id: 'i2', status: 'pivoted', maturityEffect: { c1: 3 } })],
    );
    expect(res[0].simulatedMaturity).toBe(1);
    expect(res[0].improved).toBe(false);
  });

  it('ignores out-of-range / NaN effects', () => {
    const res = simulateMaturity(
      [cap('c1', 2)],
      [init({ maturityEffect: { c1: NaN } }), init({ id: 'i2', maturityEffect: { c1: 9 } })],
    );
    expect(res[0].simulatedMaturity).toBe(2);
  });
});
