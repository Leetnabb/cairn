import type { AppState } from '../types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: Partial<AppState>;
}

export function validateImport(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, errors: ['Ugyldig JSON-format'] };
  }

  const data = raw as Record<string, unknown>;

  if (!Array.isArray(data.capabilities)) {
    errors.push('Mangler "capabilities" (array)');
  }

  if (!Array.isArray(data.scenarios)) {
    errors.push('Mangler "scenarios" (array)');
  }

  if (typeof data.scenarioStates !== 'object' || data.scenarioStates === null) {
    errors.push('Mangler "scenarioStates" (object)');
  }

  if (typeof data.activeScenario !== 'string') {
    errors.push('Mangler "activeScenario" (string)');
  }

  // Validate array item shapes
  if (Array.isArray(data.capabilities)) {
    for (const [i, cap] of (data.capabilities as unknown[]).entries()) {
      if (typeof cap !== 'object' || cap === null || typeof (cap as Record<string, unknown>).id !== 'string' || typeof (cap as Record<string, unknown>).name !== 'string') {
        errors.push(`capabilities[${i}] mangler påkrevde felter (id, name)`);
        break;
      }
    }
  }

  if (Array.isArray(data.scenarios)) {
    for (const [i, sc] of (data.scenarios as unknown[]).entries()) {
      if (typeof sc !== 'object' || sc === null || typeof (sc as Record<string, unknown>).id !== 'string' || typeof (sc as Record<string, unknown>).name !== 'string') {
        errors.push(`scenarios[${i}] mangler påkrevde felter (id, name)`);
        break;
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      capabilities: data.capabilities as AppState['capabilities'],
      scenarios: data.scenarios as AppState['scenarios'],
      scenarioStates: data.scenarioStates as AppState['scenarioStates'],
      activeScenario: data.activeScenario as string,
      milestones: Array.isArray(data.milestones) ? data.milestones as AppState['milestones'] : [],
      valueChains: Array.isArray(data.valueChains) ? data.valueChains as AppState['valueChains'] : [],
      effects: Array.isArray(data.effects) ? data.effects as AppState['effects'] : [],
      comments: Array.isArray(data.comments) ? data.comments as AppState['comments'] : [],
      snapshots: [],
    },
  };
}
