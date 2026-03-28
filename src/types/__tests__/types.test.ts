import { describe, it, expect } from 'vitest';
import type { StrategicFrame, StrategicTheme, Initiative, Effect, InitiativeStatus } from '../index';

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

describe('Initiative extended statuses', () => {
  it('accepts stopped and changed_direction statuses', () => {
    const statuses: InitiativeStatus[] = ['planned', 'in_progress', 'done', 'stopped', 'changed_direction'];
    expect(statuses).toHaveLength(5);
  });
});

describe('Initiative three horizons', () => {
  it('accepts mid as a horizon value', () => {
    const initiative: Partial<Initiative> = { horizon: 'mid' };
    expect(initiative.horizon).toBe('mid');
  });

  it('still accepts near and far for backward compat', () => {
    const near: Partial<Initiative> = { horizon: 'near' };
    const far: Partial<Initiative> = { horizon: 'far' };
    expect(near.horizon).toBe('near');
    expect(far.horizon).toBe('far');
  });
});

describe('Effect confidence field', () => {
  it('accepts effect with confidence', () => {
    const effect: Effect = {
      id: 'eff_1',
      name: 'Øke medlemstall',
      description: 'Forventet effekt av digitalisering',
      type: 'strategic',
      capabilities: [],
      initiatives: [],
      confidence: 'tentative',
    };
    expect(effect.confidence).toBe('tentative');
  });

  it('accepts effect without confidence (backward compat)', () => {
    const effect: Effect = {
      id: 'eff_2',
      name: 'Test',
      description: '',
      type: 'cost',
      capabilities: [],
      initiatives: [],
    };
    expect(effect.confidence).toBeUndefined();
  });
});
