import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../useStore';

describe('StrategicFrame store actions', () => {
  beforeEach(() => {
    useStore.setState({ strategicFrame: undefined });
  });

  it('setStrategicFrame sets the frame', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Bli datadrevet',
      goals: [],
      themes: [{ id: 'st_1', name: 'Kundedata', description: '', goalIds: [] }],
    });
    expect(useStore.getState().strategicFrame?.direction).toBe('Bli datadrevet');
  });

  it('updateStrategicDirection updates direction only', () => {
    useStore.getState().setStrategicFrame({ direction: 'Bli datadrevet', goals: [], themes: [] });
    useStore.getState().updateStrategicDirection('Digitalisere kundeflaten');
    expect(useStore.getState().strategicFrame?.direction).toBe('Digitalisere kundeflaten');
  });

  it('addStrategicTheme adds a theme', () => {
    useStore.getState().setStrategicFrame({ direction: 'Test', goals: [], themes: [] });
    useStore.getState().addStrategicTheme({ id: 'st_1', name: 'Kundedata', description: '', goalIds: [] });
    expect(useStore.getState().strategicFrame?.themes).toHaveLength(1);
  });

  it('updateStrategicTheme updates a theme by id', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Test',
      goals: [],
      themes: [{ id: 'st_1', name: 'Kundedata', description: '', goalIds: [] }],
    });
    useStore.getState().updateStrategicTheme('st_1', { name: 'Kundedata 2.0' });
    expect(useStore.getState().strategicFrame?.themes[0].name).toBe('Kundedata 2.0');
  });

  it('deleteStrategicTheme removes a theme by id', () => {
    useStore.getState().setStrategicFrame({
      direction: 'Test',
      goals: [],
      themes: [
        { id: 'st_1', name: 'A', description: '', goalIds: [] },
        { id: 'st_2', name: 'B', description: '', goalIds: [] },
      ],
    });
    useStore.getState().deleteStrategicTheme('st_1');
    expect(useStore.getState().strategicFrame?.themes).toHaveLength(1);
    expect(useStore.getState().strategicFrame?.themes[0].id).toBe('st_2');
  });

  it('deleteStrategicTheme cleans themeId references on goals and initiatives', () => {
    useStore.setState({
      strategicFrame: {
        direction: 'Test',
        goals: [
          { id: 'g1', name: 'G1', description: '', themeIds: ['st_1', 'st_2'] },
          { id: 'g2', name: 'G2', description: '', themeIds: ['st_2'] },
        ],
        themes: [
          { id: 'st_1', name: 'A', description: '', goalIds: ['g1'] },
          { id: 'st_2', name: 'B', description: '', goalIds: ['g1', 'g2'] },
        ],
      },
      activeScenario: 'sc1',
      scenarioStates: {
        sc1: {
          initiatives: [
            {
              id: 'i1',
              name: 'Init',
              dimension: 'teknologi',
              horizon: 'near',
              order: 0,
              capabilities: [],
              description: '',
              owner: '',
              dependsOn: [],
              maturityEffect: {},
              notes: '',
              valueChains: [],
              themeIds: ['st_1', 'st_2'],
            },
          ],
        },
      },
    });

    useStore.getState().deleteStrategicTheme('st_1');

    const frame = useStore.getState().strategicFrame!;
    expect(frame.themes.map((t) => t.id)).toEqual(['st_2']);
    expect(frame.goals.find((g) => g.id === 'g1')!.themeIds).toEqual(['st_2']);
    expect(frame.goals.find((g) => g.id === 'g2')!.themeIds).toEqual(['st_2']);
    expect(useStore.getState().scenarioStates.sc1.initiatives[0].themeIds).toEqual(['st_2']);
  });

  it('clearStrategicFrame removes the frame', () => {
    useStore.getState().setStrategicFrame({ direction: 'Test', goals: [], themes: [] });
    useStore.getState().clearStrategicFrame();
    expect(useStore.getState().strategicFrame).toBeUndefined();
  });

  it('updateStrategicDirection is no-op when no frame exists', () => {
    useStore.getState().updateStrategicDirection('Test');
    expect(useStore.getState().strategicFrame).toBeUndefined();
  });
});
