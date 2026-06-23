import { describe, it, expect } from 'vitest';
import { validateImport } from '../importData';

function baseFile(overrides: Record<string, unknown> = {}) {
  return {
    capabilities: [{ id: 'c1', name: 'Cap', level: 1, maturity: 2, risk: 1 }],
    scenarios: [{ id: 'default', name: 'Hovedscenario' }],
    scenarioStates: {
      default: {
        initiatives: [
          { id: 'i1', name: 'Init', dimension: 'ledelse', horizon: 'near' },
        ],
      },
    },
    activeScenario: 'default',
    ...overrides,
  };
}

describe('validateImport', () => {
  it('accepts a minimal valid file', () => {
    const res = validateImport(baseFile());
    expect(res.valid).toBe(true);
  });

  it('rejects non-object input', () => {
    expect(validateImport(null).valid).toBe(false);
    expect(validateImport('nope').valid).toBe(false);
  });

  it('rejects an activeScenario that has no scenarioState (K3)', () => {
    const res = validateImport(baseFile({ activeScenario: 'missing' }));
    expect(res.valid).toBe(false);
    expect(res.errors.join(' ')).toMatch(/activeScenario/);
  });

  it('rejects out-of-range capability enums (M9)', () => {
    const res = validateImport(
      baseFile({ capabilities: [{ id: 'c1', name: 'Cap', level: 7, maturity: 2, risk: 1 }] }),
    );
    expect(res.valid).toBe(false);
  });

  it('rejects an invalid initiative dimension (M9)', () => {
    const res = validateImport(
      baseFile({
        scenarioStates: { default: { initiatives: [{ id: 'i1', name: 'X', dimension: 'bogus', horizon: 'near' }] } },
      }),
    );
    expect(res.valid).toBe(false);
  });

  it('rejects an invalid effect type (M9)', () => {
    const res = validateImport(baseFile({ effects: [{ id: 'e1', name: 'E', type: 'nope' }] }));
    expect(res.valid).toBe(false);
  });

  it('backfills missing required initiative array fields (M9)', () => {
    const res = validateImport(baseFile());
    const init = res.data!.scenarioStates!.default.initiatives[0];
    expect(init.capabilities).toEqual([]);
    expect(init.dependsOn).toEqual([]);
    expect(init.valueChains).toEqual([]);
    expect(init.maturityEffect).toEqual({});
    expect(typeof init.order).toBe('number');
  });

  it('preserves strategicFrame, modules and strategies losslessly (K2)', () => {
    const frame = { direction: 'Nord', themes: [], goals: [] };
    const modules = { roadmap: true, capabilities: false, effects: true };
    const strategies = [{ id: 's1', name: 'S', description: 'd' }];
    const res = validateImport(baseFile({ strategicFrame: frame, modules, strategies }));
    expect(res.valid).toBe(true);
    expect(res.data!.strategicFrame).toEqual(frame);
    expect(res.data!.modules).toEqual(modules);
    expect(res.data!.strategies).toEqual(strategies);
  });
});
