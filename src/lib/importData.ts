import type {
  AppState,
  Capability,
  DimensionKey,
  Effect,
  EffectType,
  Horizon,
  Initiative,
  ScenarioState,
} from '../types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: Partial<AppState>;
}

const DIMENSION_KEYS: DimensionKey[] = ['ledelse', 'virksomhet', 'organisasjon', 'teknologi'];
const HORIZONS: Horizon[] = ['near', 'far'];
const EFFECT_TYPES: EffectType[] = ['cost', 'quality', 'speed', 'compliance', 'strategic'];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Normalise a validated raw initiative so downstream code never hits missing arrays/fields. */
function normaliseInitiative(raw: Record<string, unknown>): Initiative {
  return {
    id: raw.id as string,
    name: raw.name as string,
    dimension: raw.dimension as DimensionKey,
    horizon: raw.horizon as Horizon,
    order: typeof raw.order === 'number' ? raw.order : 0,
    capabilities: asArray<string>(raw.capabilities),
    description: asString(raw.description),
    owner: asString(raw.owner),
    dependsOn: asArray<string>(raw.dependsOn),
    maturityEffect: isObject(raw.maturityEffect) ? (raw.maturityEffect as Record<string, number>) : {},
    notes: asString(raw.notes),
    valueChains: asArray<string>(raw.valueChains),
    criticalPathOverride: (raw.criticalPathOverride as boolean | null | undefined) ?? null,
    status: raw.status as Initiative['status'],
    themeIds: Array.isArray(raw.themeIds) ? (raw.themeIds as string[]) : undefined,
  };
}

export function validateImport(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(raw)) {
    return { valid: false, errors: ['Ugyldig JSON-format'] };
  }

  const data = raw;

  if (!Array.isArray(data.capabilities)) {
    errors.push('Mangler "capabilities" (array)');
  }

  if (!Array.isArray(data.scenarios)) {
    errors.push('Mangler "scenarios" (array)');
  }

  if (!isObject(data.scenarioStates)) {
    errors.push('Mangler "scenarioStates" (object)');
  }

  if (typeof data.activeScenario !== 'string') {
    errors.push('Mangler "activeScenario" (string)');
  }

  // Validate array item shapes (including enum ranges)
  if (Array.isArray(data.capabilities)) {
    for (const [i, cap] of (data.capabilities as unknown[]).entries()) {
      const c = cap as Record<string, unknown>;
      if (
        !isObject(cap) ||
        typeof c.id !== 'string' || typeof c.name !== 'string' ||
        (c.level !== 1 && c.level !== 2) ||
        (c.maturity !== 1 && c.maturity !== 2 && c.maturity !== 3) ||
        (c.risk !== 1 && c.risk !== 2 && c.risk !== 3)
      ) {
        errors.push(`capabilities[${i}] har ugyldige felter (id, name, level∈{1,2}, maturity/risk∈{1,2,3})`);
        break;
      }
    }
  }

  if (Array.isArray(data.scenarios)) {
    for (const [i, sc] of (data.scenarios as unknown[]).entries()) {
      const s = sc as Record<string, unknown>;
      if (!isObject(sc) || typeof s.id !== 'string' || typeof s.name !== 'string') {
        errors.push(`scenarios[${i}] mangler påkrevde felter (id, name)`);
        break;
      }
    }
  }

  // Validate initiative shapes inside scenarioStates
  if (isObject(data.scenarioStates)) {
    for (const [scenarioId, ss] of Object.entries(data.scenarioStates)) {
      const ssObj = ss as Record<string, unknown>;
      if (!Array.isArray(ssObj?.initiatives)) {
        errors.push(`scenarioStates.${scenarioId} mangler initiatives-array`);
        break;
      }
      for (const [i, init] of (ssObj.initiatives as unknown[]).entries()) {
        const it = init as Record<string, unknown>;
        if (
          !isObject(init) ||
          typeof it.id !== 'string' || typeof it.name !== 'string' ||
          !DIMENSION_KEYS.includes(it.dimension as DimensionKey) ||
          !HORIZONS.includes(it.horizon as Horizon)
        ) {
          errors.push(`scenarioStates.${scenarioId}.initiatives[${i}] har ugyldige felter (id, name, dimension, horizon)`);
          break;
        }
      }
    }

    // activeScenario must reference an existing scenario state — otherwise store
    // actions that read scenarioStates[activeScenario] crash.
    if (typeof data.activeScenario === 'string' && errors.length === 0) {
      if (!(data.activeScenario in data.scenarioStates)) {
        errors.push(`"activeScenario" (${data.activeScenario}) finnes ikke i scenarioStates`);
      }
    }
  }

  // Validate effect shapes
  if (Array.isArray(data.effects)) {
    for (const [i, eff] of (data.effects as unknown[]).entries()) {
      const e = eff as Record<string, unknown>;
      if (
        !isObject(eff) || typeof e.id !== 'string' || typeof e.name !== 'string' ||
        !EFFECT_TYPES.includes(e.type as EffectType)
      ) {
        errors.push(`effects[${i}] har ugyldige felter (id, name, type)`);
        break;
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build a normalised, lossless payload. Required array fields are backfilled so
  // later exports/derivations never crash on undefined.
  const scenarioStates: Record<string, ScenarioState> = {};
  for (const [scenarioId, ss] of Object.entries(data.scenarioStates as Record<string, unknown>)) {
    const initiatives = asArray<Record<string, unknown>>((ss as Record<string, unknown>).initiatives);
    scenarioStates[scenarioId] = { initiatives: initiatives.map(normaliseInitiative) };
  }

  const result: Partial<AppState> = {
    capabilities: data.capabilities as Capability[],
    scenarios: data.scenarios as AppState['scenarios'],
    scenarioStates,
    activeScenario: data.activeScenario as string,
    milestones: asArray<AppState['milestones'][number]>(data.milestones),
    valueChains: asArray<AppState['valueChains'][number]>(data.valueChains),
    effects: asArray<Effect>(data.effects),
    comments: asArray<AppState['comments'][number]>(data.comments),
    snapshots: [],
  };

  // Lossless round-trip: preserve strategic frame, module settings and the
  // deprecated `strategies` field when present in the file.
  if (isObject(data.strategicFrame)) {
    result.strategicFrame = data.strategicFrame as unknown as AppState['strategicFrame'];
  }
  if (isObject(data.modules)) {
    result.modules = data.modules as unknown as AppState['modules'];
  }
  if (Array.isArray(data.strategies)) {
    result.strategies = data.strategies as AppState['strategies'];
  }

  return { valid: true, errors: [], data: result };
}
