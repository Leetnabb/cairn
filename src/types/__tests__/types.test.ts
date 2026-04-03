import { describe, it, expect } from 'vitest';
import type { StrategicFrame, Initiative, Effect, InitiativeStatus } from '../index';

describe('StrategicFrame type', () => {
  it('accepts a valid strategic frame', () => {
    const frame: StrategicFrame = {
      direction: 'Vi skal bli en datadrevet organisasjon',
      themes: [
        { id: 'st_1', name: 'Kundedata', description: 'Samle og bruke kundedata aktivt' },
      ],
    };
    expect(frame.direction).toBeDefined();
    expect(frame.themes).toHaveLength(1);
  });
});

describe('Initiative statuses', () => {
  it('accepts all new status values', () => {
    const statuses: InitiativeStatus[] = ['idea', 'planned', 'active', 'done', 'stopped', 'pivoted'];
    expect(statuses).toHaveLength(6);
  });
});

describe('Initiative horizons', () => {
  it('still accepts near and far', () => {
    const near: Partial<Initiative> = { horizon: 'near' };
    const far: Partial<Initiative> = { horizon: 'far' };
    expect(near.horizon).toBe('near');
    expect(far.horizon).toBe('far');
  });
});

describe('Effect type', () => {
  it('accepts effect without confidence (field removed)', () => {
    const effect: Effect = {
      id: 'eff_2',
      name: 'Test',
      description: '',
      type: 'cost',
      capabilities: [],
      initiatives: [],
    };
    expect(effect.id).toBe('eff_2');
  });
});
