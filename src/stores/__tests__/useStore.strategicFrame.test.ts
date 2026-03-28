import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../useStore';

describe('StrategicFrame store actions', () => {
  beforeEach(() => {
    useStore.setState({ strategicFrame: undefined });
  });

  it('setStrategicFrame sets the frame', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Bli datadrevet',
      themes: [{ id: 'st_1', name: 'Kundedata', description: '' }],
    });
    expect(useStore.getState().strategicFrame?.direction).toBe('Bli datadrevet');
  });

  it('updateStrategicDirection updates direction only', () => {
    useStore.getState().setStrategicFrame({ direction: 'Bli datadrevet', themes: [] });
    useStore.getState().updateStrategicDirection('Digitalisere kundeflaten');
    expect(useStore.getState().strategicFrame?.direction).toBe('Digitalisere kundeflaten');
  });

  it('addStrategicTheme adds a theme', () => {
    useStore.getState().setStrategicFrame({ direction: 'Test', themes: [] });
    useStore.getState().addStrategicTheme({ id: 'st_1', name: 'Kundedata', description: '' });
    expect(useStore.getState().strategicFrame?.themes).toHaveLength(1);
  });

  it('updateStrategicTheme updates a theme by id', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Test',
      themes: [{ id: 'st_1', name: 'Kundedata', description: '' }],
    });
    useStore.getState().updateStrategicTheme('st_1', { name: 'Kundedata 2.0' });
    expect(useStore.getState().strategicFrame?.themes[0].name).toBe('Kundedata 2.0');
  });

  it('deleteStrategicTheme removes a theme by id', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Test',
      themes: [
        { id: 'st_1', name: 'A', description: '' },
        { id: 'st_2', name: 'B', description: '' },
      ],
    });
    useStore.getState().deleteStrategicTheme('st_1');
    expect(useStore.getState().strategicFrame?.themes).toHaveLength(1);
    expect(useStore.getState().strategicFrame?.themes[0].id).toBe('st_2');
  });

  it('clearStrategicFrame removes the frame', () => {
    useStore.getState().setStrategicFrame({ direction: 'Test', themes: [] });
    useStore.getState().clearStrategicFrame();
    expect(useStore.getState().strategicFrame).toBeUndefined();
  });

  it('updateStrategicDirection is no-op when no frame exists', () => {
    useStore.getState().updateStrategicDirection('Test');
    expect(useStore.getState().strategicFrame).toBeUndefined();
  });
});
