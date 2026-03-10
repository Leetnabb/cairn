import { describe, it, expect } from 'vitest';
import { computeCriticalPath, getMergedCriticalPath } from '../criticalPath';
import type { Initiative } from '../../types';

function makeInit(id: string, dependsOn: string[] = [], overrides: Partial<Initiative> = {}): Initiative {
  return {
    id,
    name: id,
    dimension: 'ledelse',
    horizon: 'near',
    order: 0,
    owner: '',
    description: '',
    capabilities: [],
    maturityEffect: {},
    dependsOn,
    valueChains: [],
    criticalPathOverride: null,
    notes: '',
    status: 'planned',
    ...overrides,
  };
}

describe('computeCriticalPath', () => {
  it('returnerer tom set for tom liste', () => {
    expect(computeCriticalPath([])).toEqual(new Set());
  });

  it('returnerer enkelt initiativ uten avhengigheter', () => {
    const result = computeCriticalPath([makeInit('A')]);
    expect(result).toEqual(new Set(['A']));
  });

  it('finner sti A → B → C', () => {
    const inits = [makeInit('A'), makeInit('B', ['A']), makeInit('C', ['B'])];
    const result = computeCriticalPath(inits);
    expect(result).toEqual(new Set(['A', 'B', 'C']));
  });

  it('velger lengste sti ved forgrening', () => {
    // A og B er begge avhengigheter til C
    // A → C (lengde 2) vs B → X → C (lengde 3)
    const inits = [
      makeInit('A'),
      makeInit('B'),
      makeInit('X', ['B']),
      makeInit('C', ['A', 'X']),
    ];
    const result = computeCriticalPath(inits);
    // Lengste sti: B → X → C
    expect(result.has('B')).toBe(true);
    expect(result.has('X')).toBe(true);
    expect(result.has('C')).toBe(true);
    expect(result.has('A')).toBe(false);
  });

  it('ignorerer avhengigheter til ikke-eksisterende initiativ', () => {
    const inits = [makeInit('A', ['FINNES_IKKE'])];
    const result = computeCriticalPath(inits);
    expect(result).toEqual(new Set(['A']));
  });
});

describe('getMergedCriticalPath', () => {
  it('følger auto-beregning når override er null', () => {
    const inits = [makeInit('A'), makeInit('B', ['A'])];
    const { merged, auto } = getMergedCriticalPath(inits);
    expect(merged).toEqual(auto);
  });

  it('legger til initiativ som er manuelt inkludert (override=true)', () => {
    const inits = [
      makeInit('A'),
      makeInit('B', [], { criticalPathOverride: true }),
    ];
    const { merged } = getMergedCriticalPath(inits);
    expect(merged.has('B')).toBe(true);
  });

  it('ekskluderer initiativ som er manuelt ekskludert (override=false)', () => {
    const inits = [makeInit('A'), makeInit('B', ['A'], { criticalPathOverride: false })];
    const { merged } = getMergedCriticalPath(inits);
    expect(merged.has('B')).toBe(false);
  });
});
