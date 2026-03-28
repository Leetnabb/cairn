import { describe, it, expect } from 'vitest';
import { detectStrategicDrift } from '../strategicDiagnostics';
import type { Initiative, StrategicFrame } from '../../types';

const makeInit = (id: string, name: string, dim: string): Initiative => ({
  id, name, dimension: dim as any, horizon: 'near', order: 0,
  capabilities: [], description: '', owner: '', dependsOn: [],
  maturityEffect: {}, notes: '', valueChains: [],
});

describe('detectStrategicDrift', () => {
  const frame: StrategicFrame = {
    direction: 'Bli en datadrevet organisasjon',
    themes: [
      { id: 'st_1', name: 'Kundedata', description: 'Samle kundedata' },
      { id: 'st_2', name: 'Prosessdigitalisering', description: 'Digitalisere prosesser' },
    ],
  };

  it('returns no drift when no frame is set', () => {
    const result = detectStrategicDrift([], undefined);
    expect(result).toEqual([]);
  });

  it('returns no drift when frame has no themes', () => {
    const result = detectStrategicDrift([], { direction: 'Test', themes: [] });
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
