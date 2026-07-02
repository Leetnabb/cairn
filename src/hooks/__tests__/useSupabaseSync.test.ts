import { describe, it, expect } from 'vitest';
import { sanitizeRemoteState } from '../useSupabaseSync';

const validRemote = {
  capabilities: [{ id: 'c1' }],
  scenarios: [{ id: 'default', name: 'Main' }],
  scenarioStates: { default: { initiatives: [] } },
  activeScenario: 'default',
};

describe('sanitizeRemoteState', () => {
  it('returns null for non-objects and null', () => {
    expect(sanitizeRemoteState(null)).toBeNull();
    expect(sanitizeRemoteState('x')).toBeNull();
    expect(sanitizeRemoteState(42)).toBeNull();
  });

  it('returns null when scenarioStates is null/empty (M3 — no clobber with corrupt payload)', () => {
    expect(sanitizeRemoteState({ ...validRemote, scenarioStates: null })).toBeNull();
    expect(sanitizeRemoteState({ ...validRemote, scenarioStates: {} })).toBeNull();
  });

  it('falls back activeScenario to an existing key when it dangles (K3 invariant)', () => {
    const res = sanitizeRemoteState({ ...validRemote, activeScenario: 'missing' });
    expect(res?.activeScenario).toBe('default');
  });

  it('only whitelists known data fields — never leaks ui (M3)', () => {
    const res = sanitizeRemoteState({ ...validRemote, ui: { selectedItems: {} }, junk: 1 });
    expect(res).not.toBeNull();
    expect(res).not.toHaveProperty('ui');
    expect(res).not.toHaveProperty('junk');
  });

  it('maps a null strategicFrame to undefined so clearing it syncs (M4)', () => {
    const res = sanitizeRemoteState({ ...validRemote, strategicFrame: null });
    expect(res).not.toBeNull();
    expect(res!.strategicFrame).toBeUndefined();
    expect('strategicFrame' in res!).toBe(true);
  });

  it('keeps an object strategicFrame', () => {
    const frame = { direction: 'x', themes: [], goals: [] };
    const res = sanitizeRemoteState({ ...validRemote, strategicFrame: frame });
    expect(res!.strategicFrame).toEqual(frame);
  });

  it('coerces missing array fields to []', () => {
    const res = sanitizeRemoteState(validRemote);
    expect(res!.milestones).toEqual([]);
    expect(res!.effects).toEqual([]);
    expect(res!.valueChains).toEqual([]);
  });
});
