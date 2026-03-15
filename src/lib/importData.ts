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
      const c = cap as Record<string, unknown>;
      if (
        typeof cap !== 'object' || cap === null ||
        typeof c.id !== 'string' || typeof c.name !== 'string' ||
        typeof c.level !== 'number' || typeof c.maturity !== 'number' || typeof c.risk !== 'number'
      ) {
        errors.push(`capabilities[${i}] mangler påkrevde felter (id, name, level, maturity, risk)`);
        break;
      }
    }
  }

  if (Array.isArray(data.scenarios)) {
    for (const [i, sc] of (data.scenarios as unknown[]).entries()) {
      const s = sc as Record<string, unknown>;
      if (typeof sc !== 'object' || sc === null || typeof s.id !== 'string' || typeof s.name !== 'string') {
        errors.push(`scenarios[${i}] mangler påkrevde felter (id, name)`);
        break;
      }
    }
  }

  // Validate initiative shapes inside scenarioStates
  if (typeof data.scenarioStates === 'object' && data.scenarioStates !== null) {
    for (const [scenarioId, ss] of Object.entries(data.scenarioStates as Record<string, unknown>)) {
      const ssObj = ss as Record<string, unknown>;
      if (!Array.isArray(ssObj?.initiatives)) {
        errors.push(`scenarioStates.${scenarioId} mangler initiatives-array`);
        break;
      }
      for (const [i, init] of (ssObj.initiatives as unknown[]).entries()) {
        const it = init as Record<string, unknown>;
        if (
          typeof init !== 'object' || init === null ||
          typeof it.id !== 'string' || typeof it.name !== 'string' ||
          typeof it.dimension !== 'string' || typeof it.horizon !== 'string'
        ) {
          errors.push(`scenarioStates.${scenarioId}.initiatives[${i}] mangler påkrevde felter (id, name, dimension, horizon)`);
          break;
        }
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
