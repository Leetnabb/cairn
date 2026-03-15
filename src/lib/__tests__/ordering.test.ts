import { describe, it, expect } from 'vitest';
import { reorderInitiatives } from '../ordering';
import type { Initiative } from '../../types';

function makeInit(id: string, order: number, overrides: Partial<Initiative> = {}): Initiative {
  return {
    id,
    name: id,
    dimension: 'ledelse',
    horizon: 'near',
    order,
    owner: '',
    description: '',
    capabilities: [],
    maturityEffect: {},
    dependsOn: [],
    valueChains: [],
    criticalPathOverride: null,
    notes: '',
    status: 'planned',
    ...overrides,
  };
}

describe('reorderInitiatives', () => {
  it('returnerer null for ukjent id', () => {
    const initiatives = [makeInit('a', 0), makeInit('b', 1)];
    expect(reorderInitiatives(initiatives, 'x', 'ledelse', 'near', 0)).toBeNull();
  });

  it('bevarer ordre når ingen endring', () => {
    const initiatives = [makeInit('a', 0), makeInit('b', 1), makeInit('c', 2)];
    const result = reorderInitiatives(initiatives, 'a', 'ledelse', 'near', 0);
    expect(result).not.toBeNull();
    const zone = result!.filter(i => i.dimension === 'ledelse' && i.horizon === 'near')
      .sort((a, b) => a.order - b.order);
    expect(zone.map(i => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('flytter initiativ til slutten av sonen', () => {
    const initiatives = [makeInit('a', 0), makeInit('b', 1), makeInit('c', 2)];
    const result = reorderInitiatives(initiatives, 'a', 'ledelse', 'near', 2);
    expect(result).not.toBeNull();
    const zone = result!.filter(i => i.dimension === 'ledelse' && i.horizon === 'near')
      .sort((a, b) => a.order - b.order);
    expect(zone.map(i => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('setter order-verdier til sekvensielle indekser', () => {
    const initiatives = [makeInit('a', 0), makeInit('b', 1), makeInit('c', 2)];
    const result = reorderInitiatives(initiatives, 'c', 'ledelse', 'near', 0);
    expect(result).not.toBeNull();
    const zone = result!.filter(i => i.dimension === 'ledelse' && i.horizon === 'near')
      .sort((a, b) => a.order - b.order);
    expect(zone.map(i => i.order)).toEqual([0, 1, 2]);
    expect(zone.map(i => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('endrer dimensjon og horisont ved flytting mellom soner', () => {
    const initiatives = [
      makeInit('a', 0),
      makeInit('b', 0, { dimension: 'prosess', horizon: 'far' }),
    ];
    const result = reorderInitiatives(initiatives, 'a', 'prosess', 'far', 0);
    expect(result).not.toBeNull();
    const moved = result!.find(i => i.id === 'a');
    expect(moved?.dimension).toBe('prosess');
    expect(moved?.horizon).toBe('far');
  });

  it('berører ikke initiativ i andre soner', () => {
    const initiatives = [
      makeInit('a', 0),
      makeInit('b', 0, { dimension: 'prosess', horizon: 'far' }),
    ];
    const result = reorderInitiatives(initiatives, 'a', 'ledelse', 'near', 0);
    expect(result).not.toBeNull();
    const other = result!.find(i => i.id === 'b');
    expect(other?.dimension).toBe('prosess');
    expect(other?.horizon).toBe('far');
    expect(other?.order).toBe(0);
  });

  it('håndterer enkelt initiativ i sonen', () => {
    const initiatives = [makeInit('a', 5)];
    const result = reorderInitiatives(initiatives, 'a', 'ledelse', 'near', 0);
    expect(result).not.toBeNull();
    const moved = result!.find(i => i.id === 'a');
    expect(moved?.order).toBe(0);
  });

  it('håndterer tom liste', () => {
    expect(reorderInitiatives([], 'x', 'ledelse', 'near', 0)).toBeNull();
  });
});
