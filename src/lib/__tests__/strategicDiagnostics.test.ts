import { describe, it, expect } from 'vitest';
import { detectStrategicDrift, assessEffectFeasibility, detectAbsorptionIssues, detectCrossDimensionGaps, computeStrategicDiagnostics } from '../strategicDiagnostics';
import type { Initiative, StrategicFrame, Effect } from '../../types';

const makeInit = (id: string, name: string, dim: string): Initiative => ({
  id, name, dimension: dim as any, horizon: 'near', order: 0,
  capabilities: [], description: '', owner: '', dependsOn: [],
  maturityEffect: {}, notes: '', valueChains: [],
});

describe('detectStrategicDrift', () => {
  const frame: StrategicFrame = {
    direction: 'Bli en datadrevet organisasjon',
    goals: [],
    themes: [
      { id: 'st_1', name: 'Kundedata', description: 'Samle kundedata', goalIds: [] },
      { id: 'st_2', name: 'Prosessdigitalisering', description: 'Digitalisere prosesser', goalIds: [] },
    ],
  };

  it('returns no drift when no frame is set', () => {
    const result = detectStrategicDrift([], undefined);
    expect(result).toEqual([]);
  });

  it('returns no drift when frame has no themes', () => {
    const result = detectStrategicDrift([], { direction: 'Test', goals: [], themes: [] });
    expect(result).toEqual([]);
  });

  it('detects themes with no supporting initiatives', () => {
    const initiatives = [makeInit('1', 'Bygg kundedata-plattform', 'teknologi')];
    const result = detectStrategicDrift(initiatives, frame);
    const unaddressed = result.find(r => r.type === 'unaddressed_theme');
    expect(unaddressed).toBeDefined();
    expect(unaddressed?.themeName).toBe('Prosessdigitalisering');
  });

  it('matches initiatives to themes by name similarity', () => {
    const initiatives = [
      makeInit('1', 'Kundedata-plattform', 'teknologi'),
      makeInit('2', 'Digitalisere innkjøpsprosess', 'virksomhet'),
    ];
    const result = detectStrategicDrift(initiatives, frame);
    const unaddressed = result.filter(r => r.type === 'unaddressed_theme');
    expect(unaddressed).toHaveLength(0);
  });

  it('detects initiatives not matching any theme', () => {
    const initiatives = [
      makeInit('1', 'Kundedata-plattform', 'teknologi'),
      makeInit('2', 'Ny kantineløsning', 'virksomhet'),
      makeInit('3', 'Oppgradere parkeringsautomat', 'teknologi'),
    ];
    const result = detectStrategicDrift(initiatives, frame);
    const unaligned = result.find(r => r.type === 'unaligned_initiatives');
    expect(unaligned).toBeDefined();
    expect(unaligned?.count).toBeGreaterThanOrEqual(2);
  });
});

describe('assessEffectFeasibility', () => {
  it('returns empty when no effects', () => {
    expect(assessEffectFeasibility([], [])).toEqual([]);
  });

  it('warns when effect has all linked initiatives stopped', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'stopped' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'stopped' as const },
    ];
    const effects: Effect[] = [{
      id: 'e1', name: 'Øke medlemstall', description: '', type: 'strategic',
      capabilities: [], initiatives: ['1', '2'],
    }];
    const result = assessEffectFeasibility(initiatives, effects);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('effect_at_risk');
  });

  it('warns when majority of linked initiatives are stopped or changed', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'stopped' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'pivoted' as const },
      { ...makeInit('3', 'C', 'teknologi'), status: 'active' as const },
    ];
    const effects: Effect[] = [{
      id: 'e1', name: 'Øke medlemstall', description: '', type: 'strategic',
      capabilities: [], initiatives: ['1', '2', '3'],
    }];
    const result = assessEffectFeasibility(initiatives, effects);
    expect(result).toHaveLength(1);
  });

  it('does not warn when initiatives are healthy', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'active' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'planned' as const },
    ];
    const effects: Effect[] = [{
      id: 'e1', name: 'Øke medlemstall', description: '', type: 'strategic',
      capabilities: [], initiatives: ['1', '2'],
    }];
    const result = assessEffectFeasibility(initiatives, effects);
    expect(result).toHaveLength(0);
  });
});

describe('detectAbsorptionIssues', () => {
  it('returns empty when few initiatives', () => {
    const initiatives = [makeInit('1', 'A', 'teknologi')];
    expect(detectAbsorptionIssues(initiatives)).toEqual([]);
  });

  it('warns when many initiatives started but few completed', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'active' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'active' as const },
      { ...makeInit('3', 'C', 'virksomhet'), status: 'active' as const },
      { ...makeInit('4', 'D', 'organisasjon'), status: 'active' as const },
      { ...makeInit('5', 'E', 'teknologi'), status: 'active' as const },
      { ...makeInit('6', 'F', 'teknologi'), status: 'active' as const },
      { ...makeInit('7', 'G', 'teknologi'), status: 'planned' as const },
      { ...makeInit('8', 'H', 'teknologi'), status: 'done' as const },
    ];
    const result = detectAbsorptionIssues(initiatives);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('absorption_warning');
  });

  it('does not warn when ratio is healthy', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'active' as const },
      { ...makeInit('2', 'B', 'teknologi'), status: 'done' as const },
      { ...makeInit('3', 'C', 'teknologi'), status: 'done' as const },
      { ...makeInit('4', 'D', 'teknologi'), status: 'done' as const },
      { ...makeInit('5', 'E', 'teknologi'), status: 'planned' as const },
    ];
    const result = detectAbsorptionIssues(initiatives);
    expect(result).toHaveLength(0);
  });
});

describe('computeStrategicDiagnostics', () => {
  it('combines all diagnostics', () => {
    const frame: StrategicFrame = {
      direction: 'Datadrevet',
      goals: [],
      themes: [{ id: 'st_1', name: 'Kundedata', description: 'Samle data', goalIds: [] }],
    };
    const initiatives = [
      { ...makeInit('1', 'Ny kantineløsning', 'virksomhet'), status: 'active' as const },
      { ...makeInit('2', 'Kantineoppgradering', 'virksomhet'), status: 'active' as const },
      { ...makeInit('3', 'Kantine-app', 'teknologi'), status: 'active' as const },
      { ...makeInit('4', 'Kantineutvidelse', 'virksomhet'), status: 'active' as const },
      { ...makeInit('5', 'Kantineservice', 'organisasjon'), status: 'active' as const },
    ];
    const effects: Effect[] = [{
      id: 'e1', name: 'Bedre mat', description: '', type: 'quality',
      capabilities: [], initiatives: ['1', '2'],
    }];
    const results = computeStrategicDiagnostics(initiatives, effects, frame);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty without strategic frame', () => {
    const initiatives = [
      { ...makeInit('1', 'A', 'teknologi'), status: 'active' as const },
    ];
    const results = computeStrategicDiagnostics(initiatives, [], undefined);
    expect(results).toEqual([]);
  });
});

describe('detectCrossDimensionGaps', () => {
  it('warns when dimension has many inbound deps but few own initiatives', () => {
    const inits = [
      { ...makeInit('1', 'A', 'teknologi'), dependsOn: ['5'], status: 'active' as const },
      { ...makeInit('2', 'B', 'teknologi'), dependsOn: ['5'], status: 'active' as const },
      { ...makeInit('3', 'C', 'ledelse'), dependsOn: ['5'], status: 'active' as const },
      { ...makeInit('4', 'D', 'virksomhet'), dependsOn: ['5'], status: 'active' as const },
      { ...makeInit('5', 'E', 'organisasjon'), dependsOn: [], status: 'active' as const },
    ];
    const result = detectCrossDimensionGaps(inits);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('absorption_warning');
    expect(result[0].message).toContain('Organisasjon');
    expect(result[0].message).toContain('bottleneck');
  });

  it('does not warn when inbound deps are below threshold', () => {
    const inits = [
      { ...makeInit('1', 'A', 'teknologi'), dependsOn: ['3'], status: 'active' as const },
      { ...makeInit('2', 'B', 'ledelse'), dependsOn: ['3'], status: 'active' as const },
      { ...makeInit('3', 'C', 'organisasjon'), dependsOn: [], status: 'active' as const },
    ];
    const result = detectCrossDimensionGaps(inits);
    expect(result).toHaveLength(0);
  });

  it('does not warn when dimension has enough own active initiatives', () => {
    const inits = [
      { ...makeInit('1', 'A', 'teknologi'), dependsOn: ['4'], status: 'active' as const },
      { ...makeInit('2', 'B', 'ledelse'), dependsOn: ['4'], status: 'active' as const },
      { ...makeInit('3', 'C', 'virksomhet'), dependsOn: ['4'], status: 'active' as const },
      { ...makeInit('4', 'D', 'organisasjon'), dependsOn: [], status: 'active' as const },
      { ...makeInit('5', 'E', 'organisasjon'), dependsOn: [], status: 'active' as const },
    ];
    // inbound=3, own=2, 3 > 2*2=4 is false, so no warning
    const result = detectCrossDimensionGaps(inits);
    expect(result).toHaveLength(0);
  });

  it('does not count same-dimension dependencies', () => {
    const inits = [
      { ...makeInit('1', 'A', 'teknologi'), dependsOn: ['2'], status: 'active' as const },
      { ...makeInit('2', 'B', 'teknologi'), dependsOn: [], status: 'active' as const },
      { ...makeInit('3', 'C', 'teknologi'), dependsOn: ['2'], status: 'active' as const },
      { ...makeInit('4', 'D', 'teknologi'), dependsOn: ['2'], status: 'active' as const },
    ];
    const result = detectCrossDimensionGaps(inits);
    expect(result).toHaveLength(0);
  });
});
