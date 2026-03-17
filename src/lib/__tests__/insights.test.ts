import { describe, it, expect, vi } from 'vitest';
import type { Initiative, Capability, Effect } from '../../types';

// Mock i18n before importing insights
vi.mock('../../i18n', () => ({
  default: {
    t: (key: string, params?: Record<string, unknown>) => {
      const p = params ? JSON.stringify(params) : '';
      return `${key}${p}`;
    },
  },
}));

// Mock DIMENSIONS from types
vi.mock('../../types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../types')>();
  return {
    ...actual,
    DIMENSIONS: [
      { key: 'ledelse' },
      { key: 'virksomhet' },
      { key: 'organisasjon' },
      { key: 'teknologi' },
    ],
  };
});

import { computeInsights } from '../insights';

function makeInit(id: string, overrides: Partial<Initiative> = {}): Initiative {
  return {
    id,
    name: id,
    dimension: 'ledelse',
    horizon: 'near',
    order: 0,
    owner: 'owner1',
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

function makeCap(id: string, overrides: Partial<Capability> = {}): Capability {
  return {
    id,
    name: id,
    level: 2,
    maturity: 1,
    risk: 1,
    parent: 'root',
    description: '',
    ...overrides,
  };
}

function makeEffect(id: string, overrides: Partial<Effect> = {}): Effect {
  return {
    id,
    name: id,
    description: '',
    type: 'cost',
    initiatives: [],
    capabilities: [],
    indicator: '',
    baseline: '',
    target: '',
    ...overrides,
  };
}

describe('computeInsights', () => {
  it('genererer dimensjon-insights selv for tomme lister', () => {
    const insights = computeInsights([], []);
    // Alle 4 dimensjoner mangler near-aktiviteter
    expect(insights.filter(i => i.message.includes('insights.dimensionNoNear'))).toHaveLength(4);
  });

  it('gir advarsel ved kapabilitetskollisjon (≥3 initiativ)', () => {
    const cap = makeCap('cap1');
    const inits = [
      makeInit('i1', { capabilities: ['cap1'] }),
      makeInit('i2', { capabilities: ['cap1'] }),
      makeInit('i3', { capabilities: ['cap1'] }),
    ];
    const insights = computeInsights(inits, [cap]);
    expect(insights.some(i => i.type === 'warning' && i.message.includes('insights.capCollision'))).toBe(true);
  });

  it('gir ikke advarsel ved < 3 initiativ på samme kapabilitet', () => {
    const cap = makeCap('cap1');
    const inits = [
      makeInit('i1', { capabilities: ['cap1'] }),
      makeInit('i2', { capabilities: ['cap1'] }),
    ];
    const insights = computeInsights(inits, [cap]);
    expect(insights.some(i => i.message.includes('insights.capCollision'))).toBe(false);
  });

  it('gir advarsel når near-horisont avhenger av far-horisont', () => {
    const inits = [
      makeInit('far1', { horizon: 'far' }),
      makeInit('near1', { horizon: 'near', dependsOn: ['far1'] }),
    ];
    const insights = computeInsights(inits, []);
    expect(insights.some(i => i.message.includes('insights.nearDependsFar'))).toBe(true);
  });

  it('gir advarsel ved eierkapasitet (≥4 aktiviteter)', () => {
    const inits = Array.from({ length: 4 }, (_, k) => makeInit(`i${k}`, { owner: 'same_owner' }));
    const insights = computeInsights(inits, []);
    expect(insights.some(i => i.message.includes('insights.ownerCapacity'))).toBe(true);
  });

  it('gir info når dimensjon mangler near-aktiviteter', () => {
    // Ingen initiativ med dimension 'virksomhet'
    const inits = [makeInit('i1', { dimension: 'ledelse', horizon: 'near' })];
    const insights = computeInsights(inits, []);
    expect(insights.some(i => i.message.includes('insights.dimensionNoNear'))).toBe(true);
  });

  it('gir positiv melding når alle dimensjoner er dekket', () => {
    const inits = [
      makeInit('i1', { dimension: 'ledelse' }),
      makeInit('i2', { dimension: 'virksomhet' }),
      makeInit('i3', { dimension: 'organisasjon' }),
      makeInit('i4', { dimension: 'teknologi' }),
    ];
    const insights = computeInsights(inits, []);
    expect(insights.some(i => i.type === 'positive')).toBe(true);
  });

  it('gir advarsel for foreldreløse kapabiliteter', () => {
    const cap = makeCap('orphan', { level: 2 });
    const insights = computeInsights([], [cap]);
    expect(insights.some(i => i.message.includes('insights.orphanCapability'))).toBe(true);
  });

  it('gir advarsel for initiativ uten kapabilitetstilknytning', () => {
    const init = makeInit('lonely', { capabilities: [] });
    const insights = computeInsights([init], []);
    expect(insights.some(i => i.message.includes('insights.orphanInitiative'))).toBe(true);
  });

  it('gir advarsel for effekt uten near-initiativ', () => {
    const eff = makeEffect('eff1', { initiatives: [] });
    const insights = computeInsights([], [], [eff]);
    expect(insights.some(i => i.message.includes('effects.effectsWithoutNearInitiatives'))).toBe(true);
  });

  it('gir advarsel for initiativ uten effektkobling', () => {
    const init = makeInit('i1');
    const eff = makeEffect('eff1', { initiatives: ['other'] });
    const insights = computeInsights([init], [], [eff]);
    expect(insights.some(i => i.message.includes('effects.initiativeWithoutEffect'))).toBe(true);
  });
});
