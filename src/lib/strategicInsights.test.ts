import { describe, it, expect, vi } from 'vitest';
import { computeStrategicInsights } from './strategicInsights';

vi.mock('react-i18next', () => ({
  default: { t: (k: string) => k },
}));

describe('computeStrategicInsights', () => {
  it('returns max 4 insights ranked by priority', () => {
    const initiatives = [
      ...Array.from({ length: 9 }, (_, i) => makeInit({ id: `t${i}`, dimension: 'teknologi' })),
      makeInit({ id: 'l1', dimension: 'ledelse' }),
    ];
    const capabilities = [
      makeCap({ id: 'c1', maturity: 1, risk: 3 }),
    ];
    const result = computeStrategicInsights(initiatives, capabilities, []);
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result[0].priority).toBeLessThanOrEqual(result[1]?.priority ?? Infinity);
  });

  it('detects dimension imbalance when one dimension dominates', () => {
    const initiatives = [
      ...Array.from({ length: 8 }, (_, i) => makeInit({ id: `t${i}`, dimension: 'teknologi' })),
      makeInit({ id: 'o1', dimension: 'organisasjon' }),
    ];
    const result = computeStrategicInsights(initiatives, [], []);
    const imbalance = result.find(r => r.type === 'imbalance');
    expect(imbalance).toBeDefined();
    expect(imbalance!.message).toContain('teknologi');
  });

  it('detects unlinked capabilities', () => {
    const initiatives = [makeInit({ id: 'i1', capabilities: [] })];
    const capabilities = [makeCap({ id: 'c1' }), makeCap({ id: 'c2' })];
    const result = computeStrategicInsights(initiatives, capabilities, []);
    const blocker = result.find(r => r.type === 'blocker');
    expect(blocker).toBeDefined();
  });

  it('detects unlinked effects', () => {
    const initiatives = [makeInit({ id: 'i1' })];
    const effects = [makeEffect({ id: 'e1', initiatives: [] })];
    const result = computeStrategicInsights(initiatives, [], effects);
    const gap = result.find(r => r.type === 'gap');
    expect(gap).toBeDefined();
  });

  it('detects owner overload', () => {
    const initiatives = Array.from({ length: 5 }, (_, i) => makeInit({ id: `i${i}`, owner: 'Alice' }));
    const result = computeStrategicInsights(initiatives, [], []);
    const overload = result.find(r => r.type === 'blocker' && r.message.includes('Alice'));
    expect(overload).toBeDefined();
  });

  it('formats insights as discussion-ready text, not technical warnings', () => {
    const initiatives = [
      ...Array.from({ length: 8 }, (_, i) => makeInit({ id: `t${i}`, dimension: 'teknologi' })),
      makeInit({ id: 'o1', dimension: 'organisasjon' }),
    ];
    const result = computeStrategicInsights(initiatives, [], []);
    result.forEach(insight => {
      expect(insight.message).not.toMatch(/^WARNING/i);
    });
  });
});

function makeInit(overrides: Partial<any> = {}) {
  return {
    id: 'i1', name: 'Test', dimension: 'teknologi' as const, horizon: 'near' as const,
    order: 0, capabilities: [], description: '', owner: '',
    dependsOn: [], maturityEffect: {}, notes: '', valueChains: [],
    status: 'planned', confidence: 'confirmed', ...overrides,
  };
}

function makeCap(overrides: Partial<any> = {}) {
  return {
    id: 'c1', name: 'Cap', level: 1 as const, parent: null,
    maturity: 2, risk: 1, description: '', order: 0, ...overrides,
  };
}

function makeEffect(overrides: Partial<any> = {}) {
  return {
    id: 'e1', name: 'Effect', type: 'cost' as const, description: '',
    initiatives: [], capabilities: [], indicator: '', baseline: '', target: '', ...overrides,
  };
}
