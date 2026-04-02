export type InitiativeStatus = 'planned' | 'in_progress' | 'done' | 'stopped' | 'changed_direction';

export type ConfidenceLevel = 'confirmed' | 'tentative' | 'under_consideration';

export type Horizon = 'near' | 'far';

export type DimensionKey = 'ledelse' | 'virksomhet' | 'organisasjon' | 'teknologi';

export interface Dimension {
  key: DimensionKey;
  label: string;
  color: string;
  bgColor: string;
  bgLight: string;
  textColor: string;
}

export const DIMENSIONS: Dimension[] = [
  { key: 'ledelse', label: 'Ledelse', color: '#ef4444', bgColor: '#fef2f2', bgLight: '#fff5f5', textColor: '#991b1b' },
  { key: 'virksomhet', label: 'Virksomhet', color: '#22c55e', bgColor: '#f0fdf4', bgLight: '#f7fef9', textColor: '#166534' },
  { key: 'organisasjon', label: 'Organisasjon', color: '#eab308', bgColor: '#fefce8', bgLight: '#fefef0', textColor: '#854d0e' },
  { key: 'teknologi', label: 'Teknologi', color: '#6366f1', bgColor: '#eef2ff', bgLight: '#f5f7ff', textColor: '#3730a3' },
];

export const DIMENSION_MAP: Record<DimensionKey, Dimension> = Object.fromEntries(
  DIMENSIONS.map(d => [d.key, d])
) as Record<DimensionKey, Dimension>;

export interface Strategy {
  id: string;
  name: string;
  description: string;
  timeHorizon: 'short' | 'medium' | 'long';
  priority: 1 | 2 | 3;
}

export interface StrategicTheme {
  id: string;
  name: string;
  description: string;
}

export interface StrategicFrame {
  direction: string;
  themes: StrategicTheme[];
}

export interface Capability {
  id: string;
  name: string;
  level: 1 | 2;
  parent: string | null;
  maturity: 1 | 2 | 3;
  maturityTarget?: 1 | 2 | 3;
  risk: 1 | 2 | 3;
  description: string;
  order?: number;
  priorityWeight?: number;  // 1-10, for sorting within Core/Support sections
  strategyIds?: string[];
  capabilityType?: 'core' | 'support';
  providesFoundationFor?: string[];
  resourceLoad?: number;  // 0.0-1.0, current resource load on this capability
  effortEstimate?: 'high' | 'medium' | 'low';
}

export interface Initiative {
  id: string;
  name: string;
  dimension: DimensionKey;
  horizon: Horizon;
  order: number;
  capabilities: string[];
  description: string;
  owner: string;
  dependsOn: string[];
  maturityEffect: Record<string, number>;
  notes: string;
  valueChains: string[];
  criticalPathOverride?: boolean | null;
  status?: InitiativeStatus;
  confidence?: ConfidenceLevel;
}

export interface Scenario {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Milestone {
  id: string;
  name: string;
  horizon: Horizon;
  position: number;
  color: string;
}

export interface ValueChain {
  id: string;
  name: string;
  color: string;
}

export type EffectType = 'cost' | 'quality' | 'speed' | 'compliance' | 'strategic';

export interface Effect {
  id: string;
  name: string;
  description: string;
  type: EffectType;
  capabilities: string[];
  initiatives: string[];
  indicator?: string;
  baseline?: string;
  target?: string;
  order?: number;
  confidence?: ConfidenceLevel;
}

export const EFFECT_TYPE_COLORS: Record<EffectType, string> = {
  cost: '#f59e0b',
  quality: '#22c55e',
  speed: '#3b82f6',
  compliance: '#8b5cf6',
  strategic: '#ec4899',
};

export const EFFECT_TYPE_LABELS: Record<EffectType, string> = {
  cost: 'Cost',
  quality: 'Quality',
  speed: 'Speed',
  compliance: 'Compliance',
  strategic: 'Strategic',
};

export interface Comment {
  id: string;
  itemId: string;
  text: string;
  author?: string;
  timestamp: string;
}

export interface Snapshot {
  id: string;
  timestamp: string;
  label?: string;
  data: AppState;
}

export interface ScenarioState {
  initiatives: Initiative[];
}

export interface ModuleSettings {
  roadmap: boolean;
  capabilities: boolean;
  effects: boolean;
}

export interface AppState {
  strategies: Strategy[];
  capabilities: Capability[];
  scenarios: Scenario[];
  scenarioStates: Record<string, ScenarioState>;
  activeScenario: string;
  milestones: Milestone[];
  valueChains: ValueChain[];
  effects: Effect[];
  comments: Comment[];
  snapshots: Snapshot[];
  modules: ModuleSettings;
  strategicFrame?: StrategicFrame;
}

export type ViewMode = 'roadmap' | 'dashboard' | 'compare' | 'capabilities' | 'effects' | 'strategies';

export type MeetingLens = 'narrative' | 'path' | 'capabilities' | 'effects';

export type ComplexityLevel = 1 | 2 | 3;

export const COMPLEXITY_FEATURES = {
  1: {
    views: ['roadmap', 'dashboard', 'capabilities'] as ViewMode[],
    filters: ['dimensions', 'search'] as string[],
    features: ['presentationMode'] as string[],
  },
  2: {
    views: ['roadmap', 'dashboard', 'capabilities', 'effects', 'strategies'] as ViewMode[],
    filters: ['dimensions', 'search', 'horizon', 'owner', 'status', 'milestones'] as string[],
    features: ['presentationMode'] as string[],
  },
  3: {
    views: ['roadmap', 'dashboard', 'capabilities', 'effects', 'strategies', 'compare'] as ViewMode[],
    filters: ['dimensions', 'search', 'horizon', 'owner', 'status', 'milestones', 'focusMode', 'zoomLevel', 'spotlightValueChain'] as string[],
    features: ['presentationMode', 'simulation', 'criticalPath', 'scenarios', 'benchmarking', 'import', 'export'] as string[],
  },
};

export interface UIState {
  selectedItem: { type: 'capability' | 'initiative' | 'milestone' | 'effect' | 'strategy'; id: string } | null;
  view: ViewMode;
  complexityLevel: ComplexityLevel;
  roadmapViewMode: 'dimension' | 'capability';
  capabilityView: 'maturity' | 'risk' | 'resource';
  simulationEnabled: boolean;
  criticalPathEnabled: boolean;
  filters: {
    dimensions: DimensionKey[];
    horizon: 'all' | Horizon;
    owner: string;
    search: string;
    showMilestones: boolean;
    status: InitiativeStatus | '';
    focusMode: boolean;
    zoomLevel: number;
    spotlightValueChain: string | null;
  };
  editingId: string | null;
  addModalOpen: boolean;
  addModalTab: 'initiative' | 'capability' | 'milestone' | 'valuechain' | 'effect' | 'strategy';
  addModalDefaults: { dimension?: DimensionKey; horizon?: Horizon } | null;
  importModalOpen: boolean;
  presentationMode: boolean;
  presentationSlide: number;
  compareScenario: string | null;
  insightsExpanded: boolean;
  selectedItems: Set<string>;
  filterDropdownOpen: boolean;
  capabilityOverlayOpen: boolean;
  roleMode: 'work' | 'governance';
  boardViewMode: boolean;
  boardSelectedItem: { type: 'capability' | 'initiative'; id: string } | null;
  settingsOpen: boolean;
  meetingMode: boolean;
  meetingLens: MeetingLens;
}

export const MATURITY_COLORS: Record<number, string> = {
  1: '#dc2626',
  2: '#f59e0b',
  3: '#22c55e',
};

export const MATURITY_LABELS: Record<number, string> = {
  1: 'Lav',
  2: 'Medium',
  3: 'Høy',
};

export const RISK_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#f59e0b',
  3: '#dc2626',
};

export const RISK_LABELS: Record<number, string> = {
  1: 'Lav',
  2: 'Medium',
  3: 'Høy',
};
