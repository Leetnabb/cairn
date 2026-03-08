import type { Capability, Initiative, Milestone, ValueChain, Scenario, ScenarioState, Effect } from '../types';
import { frivilligTemplate } from './templates/frivillig';

// Re-export from frivillig template for backward compatibility
export const defaultCapabilities: Capability[] = frivilligTemplate.capabilities;
export const defaultInitiatives: Initiative[] = frivilligTemplate.sampleInitiatives;
export const defaultValueChains: ValueChain[] = frivilligTemplate.valueChains;
export const defaultEffects: Effect[] = frivilligTemplate.effects;

export const defaultMilestones: Milestone[] = [
  { id: 'm1', name: 'Strategivedtak', horizon: 'near', position: 0.15, color: '#6366f1' },
  { id: 'm2', name: 'Go/no-go pilot', horizon: 'near', position: 0.6, color: '#eab308' },
  { id: 'm3', name: 'Midtveisevaluering', horizon: 'far', position: 0.4, color: '#3b82f6' },
];

export const defaultScenario: Scenario = {
  id: 'default',
  name: 'Hovedscenario',
  color: '#6366f1',
};

export function createDefaultState(): {
  capabilities: Capability[];
  scenarios: Scenario[];
  scenarioStates: Record<string, ScenarioState>;
  activeScenario: string;
  milestones: Milestone[];
  valueChains: ValueChain[];
  effects: Effect[];
} {
  return {
    capabilities: defaultCapabilities,
    scenarios: [defaultScenario],
    scenarioStates: {
      [defaultScenario.id]: { initiatives: defaultInitiatives },
    },
    activeScenario: defaultScenario.id,
    milestones: defaultMilestones,
    valueChains: defaultValueChains,
    effects: defaultEffects,
  };
}
