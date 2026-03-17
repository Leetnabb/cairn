import { describe, it, expect } from 'vitest';
import { extractBenchmarkVector, anonymiseId, computeGini } from '../benchmarkExtractor.js';

// Sample scenario state with realistic data
function makeSampleState(overrides: Record<string, unknown> = {}) {
  return {
    initiatives: [
      {
        id: 'init-1',
        horizon: 'near',
        dimension: 'ledelse',
        confidence: 'confirmed',
        capabilities: ['cap-1'],
        owner: 'Alice',
        name: 'Initiative A',
        description: 'This is a text description that must not leak',
        notes: 'Private notes here',
      },
      {
        id: 'init-2',
        horizon: 'far',
        dimension: 'virksomhet',
        confidence: 'tentative',
        capabilities: ['cap-2'],
        owner: 'Bob',
        name: 'Initiative B',
        description: 'Another description',
      },
      {
        id: 'init-3',
        horizon: 'near',
        dimension: 'teknologi',
        confidence: 'under_consideration',
        capabilities: [],
        owner: 'Alice',
        name: 'Initiative C',
        description: 'Third description',
      },
      {
        id: 'init-4',
        horizon: 'near',
        dimension: 'organisasjon',
        confidence: 'confirmed',
        capabilities: ['cap-1', 'cap-3'],
        owner: 'Charlie',
        name: 'Initiative D',
      },
    ],
    capabilities: [
      { id: 'cap-1', name: 'Capability 1', maturity: 2, risk: 1 },
      { id: 'cap-2', name: 'Capability 2', maturity: 3, risk: 2 },
      { id: 'cap-3', name: 'Capability 3', maturity: 1, risk: 3 },
    ],
    effects: [
      { id: 'eff-1', name: 'Effect 1', type: 'cost', initiatives: ['init-1', 'init-2'] },
      { id: 'eff-2', name: 'Effect 2', type: 'quality', initiatives: [] },
      { id: 'eff-3', name: 'Effect 3', type: 'strategic', initiatives: ['init-3'] },
    ],
    criticalPathLength: 3,
    scenarioCount: 2,
    ...overrides,
  };
}

describe('extractBenchmarkVector', () => {
  it('extracts correct counts from a sample state', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO');

    expect(vector).not.toBeNull();
    expect(vector!.initiativeCount).toBe(4);
    expect(vector!.capabilityCount).toBe(3);
    expect(vector!.effectCount).toBe(3);
    expect(vector!.planTier).toBe('PRO');
  });

  it('calculates correct horizon distribution', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO')!;

    // 3 near, 1 far out of 4
    expect(vector.nearHorizonPct).toBe(75);
    expect(vector.farHorizonPct).toBe(25);
  });

  it('calculates correct confidence distribution', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO')!;

    // 2 confirmed, 1 tentative, 1 under_consideration out of 4
    expect(vector.confirmedPct).toBe(50);
    expect(vector.tentativePct).toBe(25);
    expect(vector.underConsiderationPct).toBe(25);
  });

  it('maps Norwegian dimension keys to English in initiativesPerDimension', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO')!;

    expect(vector.initiativesPerDimension).toEqual({
      leadership: 1,
      business: 1,
      organisation: 1,
      technology: 1,
    });
  });

  it('calculates capability metrics correctly', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO')!;

    // cap-1, cap-2, cap-3 are referenced (cap-1 by init-1+init-4, cap-2 by init-2, cap-3 by init-4)
    // All 3 capabilities referenced = 100% coverage
    expect(vector.capabilityCoverage).toBe(100);
    expect(vector.capabilitiesWithNoInitiatives).toBe(0);

    // Average maturity: (2+3+1)/3 = 2.0
    expect(vector.avgCapabilityMaturity).toBe(2);
    // Average risk: (1+2+3)/3 = 2.0
    expect(vector.avgCapabilityRisk).toBe(2);
  });

  it('calculates effect metrics correctly', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO')!;

    // 2 out of 3 effects have initiatives linked
    expect(vector.effectLinkage).toBeCloseTo(66.67, 1);
    expect(vector.effectsWithNoInitiatives).toBe(1);

    // init-4 is not in any effect's initiatives array
    expect(vector.initiativesWithNoEffects).toBe(1);

    expect(vector.effectTypeDistribution).toEqual({
      cost: 1,
      quality: 1,
      speed: 0,
      compliance: 0,
      strategic: 1,
    });
  });

  it('calculates max owner load correctly', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO')!;

    // Alice has 2 initiatives, Bob has 1, Charlie has 1
    expect(vector.maxOwnerLoad).toBe(2);
  });

  it('includes scenario count and critical path length', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO')!;

    expect(vector.criticalPathLength).toBe(3);
    expect(vector.scenarioCount).toBe(2);
  });

  it('returns null when fewer than 3 initiatives', () => {
    const state = makeSampleState({
      initiatives: [
        { id: '1', horizon: 'near', dimension: 'ledelse', confidence: 'confirmed' },
        { id: '2', horizon: 'far', dimension: 'teknologi', confidence: 'tentative' },
      ],
    });
    expect(extractBenchmarkVector(state, 'FREE')).toBeNull();
  });

  it('returns null with empty initiatives', () => {
    expect(extractBenchmarkVector({ initiatives: [] }, 'FREE')).toBeNull();
  });

  it('returns null with missing initiatives key', () => {
    expect(extractBenchmarkVector({}, 'FREE')).toBeNull();
  });

  it('contains zero text/string fields in the extracted vector (no data leakage)', () => {
    const state = makeSampleState();
    const vector = extractBenchmarkVector(state, 'PRO')!;

    // Walk every value in the vector and verify no free-text strings appear
    const disallowedStrings = [
      'Initiative A', 'Initiative B', 'Initiative C', 'Initiative D',
      'Capability 1', 'Capability 2', 'Capability 3',
      'Effect 1', 'Effect 2', 'Effect 3',
      'This is a text description',
      'Private notes',
      'Alice', 'Bob', 'Charlie',
      'init-1', 'init-2', 'init-3', 'init-4',
      'cap-1', 'cap-2', 'cap-3',
      'eff-1', 'eff-2', 'eff-3',
    ];

    const json = JSON.stringify(vector);
    for (const s of disallowedStrings) {
      expect(json).not.toContain(s);
    }

    // Verify only expected string fields exist (planTier is an enum, dimension keys are canonical)
    for (const [key, value] of Object.entries(vector)) {
      if (typeof value === 'string') {
        // Only planTier should be a string
        expect(key).toBe('planTier');
        expect(['FREE', 'PRO', 'ENTERPRISE']).toContain(value);
      } else if (typeof value === 'object' && value !== null) {
        // JSONB fields should only contain numbers
        for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
          expect(typeof subVal).toBe('number');
          // Keys should be canonical dimension/effect type names, not free text
          expect(subKey).toMatch(/^[a-z]+$/);
        }
      }
    }
  });

  it('handles state with no capabilities or effects gracefully', () => {
    const state = makeSampleState({ capabilities: [], effects: [] });
    const vector = extractBenchmarkVector(state, 'FREE')!;

    expect(vector.capabilityCount).toBe(0);
    expect(vector.effectCount).toBe(0);
    expect(vector.capabilityCoverage).toBeNull();
    expect(vector.effectLinkage).toBeNull();
    expect(vector.avgCapabilityMaturity).toBeNull();
    expect(vector.avgCapabilityRisk).toBeNull();
    expect(vector.capabilitiesWithNoInitiatives).toBe(0);
    expect(vector.effectsWithNoInitiatives).toBe(0);
    // All initiatives have no effects when effects array is empty
    expect(vector.initiativesWithNoEffects).toBe(4);
  });
});

describe('computeGini', () => {
  it('returns 0 for equal distribution', () => {
    expect(computeGini([5, 5, 5, 5])).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(computeGini([])).toBe(0);
  });

  it('returns 0 for all-zero values', () => {
    expect(computeGini([0, 0, 0])).toBe(0);
  });

  it('returns positive value for unequal distribution', () => {
    const gini = computeGini([10, 0, 0, 0]);
    expect(gini).toBeGreaterThan(0);
    expect(gini).toBeLessThanOrEqual(1);
  });

  it('returns higher value for more concentrated distribution', () => {
    const spread = computeGini([3, 3, 2, 2]);
    const concentrated = computeGini([9, 1, 0, 0]);
    expect(concentrated).toBeGreaterThan(spread);
  });
});

describe('anonymiseId', () => {
  it('produces consistent hashes for the same input', () => {
    const hash1 = anonymiseId('test-id-123');
    const hash2 = anonymiseId('test-id-123');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', () => {
    const hash1 = anonymiseId('tenant-a');
    const hash2 = anonymiseId('tenant-b');
    expect(hash1).not.toBe(hash2);
  });

  it('returns a hex string of length 64 (SHA-256)', () => {
    const hash = anonymiseId('any-id');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
