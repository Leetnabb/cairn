import { describe, it, expect } from 'vitest';
import { parseStrategicPicture, type GeneratedStrategicPicture } from './generateStrategicPicture';

const validResponse: GeneratedStrategicPicture = {
  strategies: [
    { name: 'Digital transformasjon', description: 'Modernisere tjenester' }
  ],
  capabilities: [
    { name: 'Skyplattform', description: 'Cloud-first', level: 1, parent: null, maturity: 1, risk: 2 }
  ],
  initiatives: [
    { name: 'Migrere til sky', dimension: 'teknologi', horizon: 'near', description: 'Flytt kjernesystemer' }
  ],
  effects: [
    { name: 'Reduserte driftskostnader', type: 'cost', description: 'Lavere infra-kostnader' }
  ],
  insights: [
    '4 av 5 initiativer er teknologi — organisasjonsendring mangler'
  ],
};

describe('parseStrategicPicture', () => {
  it('parses valid JSON response', () => {
    const result = parseStrategicPicture(JSON.stringify(validResponse));
    expect(result.strategies).toHaveLength(1);
    expect(result.capabilities).toHaveLength(1);
    expect(result.initiatives).toHaveLength(1);
    expect(result.effects).toHaveLength(1);
    expect(result.insights).toHaveLength(1);
  });

  it('parses response wrapped in markdown code block', () => {
    const wrapped = '```json\n' + JSON.stringify(validResponse) + '\n```';
    const result = parseStrategicPicture(wrapped);
    expect(result.strategies).toHaveLength(1);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseStrategicPicture('not json')).toThrow();
  });

  it('throws on missing required fields', () => {
    expect(() => parseStrategicPicture(JSON.stringify({ strategies: [] }))).toThrow();
  });
});
