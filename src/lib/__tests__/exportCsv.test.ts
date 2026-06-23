import { describe, it, expect } from 'vitest';
import { filterInitiatives, escapeCsv } from '../exportCsv';
import type { Initiative } from '../../types';

const makeInit = (over: Partial<Initiative> = {}): Initiative => ({
  id: 'i1', name: 'A', dimension: 'ledelse', horizon: 'near', order: 0,
  capabilities: [], description: '', owner: '', dependsOn: [],
  maturityEffect: {}, notes: '', valueChains: [], ...over,
});

describe('filterInitiatives', () => {
  it('filters by dimension', () => {
    const inits = [
      makeInit({ id: '1', name: 'Alpha', dimension: 'ledelse' }),
      makeInit({ id: '2', name: 'Beta', dimension: 'teknologi' }),
    ];
    const res = filterInitiatives(inits, {
      dimensions: ['teknologi'], horizon: 'all', owner: '', search: '', status: '',
      showMilestones: false, focusMode: false, zoomLevel: 1, spotlightValueChain: null,
    });
    expect(res.map(i => i.id)).toEqual(['2']);
  });
});

describe('escapeCsv formula-injection guard (M7)', () => {
  it('prefixes dangerous leading characters with a quote', () => {
    expect(escapeCsv('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(escapeCsv('+1')).toBe("'+1");
    expect(escapeCsv('-1')).toBe("'-1");
    expect(escapeCsv('@cmd')).toBe("'@cmd");
  });

  it('quotes values containing separators or newlines', () => {
    expect(escapeCsv('a;b')).toBe('"a;b"');
    expect(escapeCsv('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsv('he said "hi"')).toBe('"he said ""hi"""');
  });

  it('leaves safe values untouched', () => {
    expect(escapeCsv('Normal text')).toBe('Normal text');
    expect(escapeCsv('1 + 1')).toBe('1 + 1');
  });
});
