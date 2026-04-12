import type { Capability, Initiative, Milestone, ValueChain, Scenario, ScenarioState, Effect, ModuleSettings, Strategy, StrategicFrame } from '../types';
import { frivilligTemplate } from './templates/frivillig';

// Re-export from frivillig template for backward compatibility
export const defaultCapabilities: Capability[] = frivilligTemplate.capabilities;
export const defaultInitiatives: Initiative[] = frivilligTemplate.sampleInitiatives;
export const defaultValueChains: ValueChain[] = frivilligTemplate.valueChains;
export const defaultEffects: Effect[] = frivilligTemplate.effects;

export const defaultStrategies: Strategy[] = [
  { id: 'strat_1', name: 'Digital Transformation', description: 'Modernize digital systems and workflows', timeHorizon: 'long', priority: 1 },
  { id: 'strat_2', name: 'Data-Driven Organization', description: 'Use data actively in decision-making', timeHorizon: 'medium', priority: 1 },
  { id: 'strat_3', name: 'Member Growth', description: 'Increase member count and engagement', timeHorizon: 'short', priority: 2 },
];

export const defaultMilestones: Milestone[] = [
  { id: 'm1', name: 'Strategy Approval', horizon: 'near', position: 0.15, color: '#6366f1' },
  { id: 'm2', name: 'Pilot Go/No-Go', horizon: 'near', position: 0.6, color: '#eab308' },
  { id: 'm3', name: 'Mid-Term Review', horizon: 'far', position: 0.4, color: '#3b82f6' },
];

export const defaultScenario: Scenario = {
  id: 'default',
  name: 'Main Scenario',
  color: '#6366f1',
};

// Default for new users: roadmap only. Existing users get all enabled via merge fallback in store.
export const defaultModules: ModuleSettings = {
  roadmap: true,
  capabilities: false,
  effects: false,
};

export const defaultStrategicFrame: StrategicFrame = {
  direction: 'Become a data-driven, member-focused organization through digital transformation',
  themes: [
    { id: 'st_1', name: 'Customer Data', description: 'Collect, structure, and actively use customer data in decisions' },
    { id: 'st_2', name: 'Process Digitalization', description: 'Digitalize core workflows for efficiency' },
    { id: 'st_3', name: 'Competence Development', description: 'Build digital competence across the entire organization' },
  ],
};

export function createDefaultState(): {
  strategies: Strategy[];
  capabilities: Capability[];
  scenarios: Scenario[];
  scenarioStates: Record<string, ScenarioState>;
  activeScenario: string;
  milestones: Milestone[];
  valueChains: ValueChain[];
  effects: Effect[];
  modules: ModuleSettings;
  strategicFrame: StrategicFrame;
} {
  return {
    strategies: defaultStrategies,
    capabilities: defaultCapabilities,
    scenarios: [defaultScenario],
    scenarioStates: {
      [defaultScenario.id]: { initiatives: defaultInitiatives },
    },
    activeScenario: defaultScenario.id,
    milestones: defaultMilestones,
    valueChains: defaultValueChains,
    effects: defaultEffects,
    modules: defaultModules,
    strategicFrame: defaultStrategicFrame,
  };
}
