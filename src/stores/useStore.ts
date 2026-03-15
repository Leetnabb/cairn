import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { AppState, UIState, Capability, Initiative, Scenario, Milestone, ValueChain, Effect, Comment, Snapshot, DimensionKey, ViewMode } from '../types';
import { createDefaultState } from '../data/defaults';
import type { IndustryTemplate } from '../data/templates';
import { reorderInitiatives } from '../lib/ordering';

// One-time migration from old storage key
const _legacyStorage = localStorage.getItem('ea-light-storage');
if (_legacyStorage && !localStorage.getItem('cairn-storage')) {
  localStorage.setItem('cairn-storage', _legacyStorage);
  localStorage.removeItem('ea-light-storage');
}

export const EMPTY_INITIATIVES: Initiative[] = [];

interface StoreState extends AppState {
  ui: UIState;

  // Initiative CRUD
  addInitiative: (initiative: Initiative) => void;
  updateInitiative: (id: string, updates: Partial<Initiative>) => void;
  deleteInitiative: (id: string) => void;
  moveInitiative: (id: string, dimension: DimensionKey, horizon: 'near' | 'far', newOrder: number) => void;

  // Capability CRUD
  addCapability: (capability: Capability) => void;
  updateCapability: (id: string, updates: Partial<Capability>) => void;
  deleteCapability: (id: string) => void;

  // Scenario CRUD
  addScenario: (scenario: Scenario, cloneFrom?: string) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  setActiveScenario: (id: string) => void;

  // Milestone CRUD
  addMilestone: (milestone: Milestone) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;

  // Value Chain CRUD
  addValueChain: (vc: ValueChain) => void;
  updateValueChain: (id: string, updates: Partial<ValueChain>) => void;
  deleteValueChain: (id: string) => void;

  // Effect CRUD
  addEffect: (effect: Effect) => void;
  updateEffect: (id: string, updates: Partial<Effect>) => void;
  deleteEffect: (id: string) => void;

  // Comments
  addComment: (comment: Comment) => void;
  deleteComment: (id: string) => void;

  // Snapshots
  saveSnapshot: (label?: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;

  // UI actions
  setSelectedItem: (item: UIState['selectedItem']) => void;
  setView: (view: ViewMode) => void;
  setCapabilityView: (view: 'maturity' | 'risk') => void;
  toggleSimulation: () => void;
  toggleCriticalPath: () => void;
  setFilter: (filters: Partial<UIState['filters']>) => void;
  resetFilters: () => void;
  setEditingId: (id: string | null) => void;
  setAddModalOpen: (open: boolean, tab?: UIState['addModalTab'], defaults?: UIState['addModalDefaults']) => void;
  setImportModalOpen: (open: boolean) => void;
  setPresentationMode: (active: boolean) => void;
  setPresentationSlide: (slide: number) => void;
  setCompareScenario: (id: string | null) => void;
  setInsightsExpanded: (expanded: boolean) => void;
  setFilterDropdownOpen: (open: boolean) => void;
  setCapabilityOverlayOpen: (open: boolean) => void;
  setRoleMode: (mode: 'work' | 'governance') => void;

  // Bulk operations
  toggleSelectedItem: (id: string) => void;
  clearSelectedItems: () => void;
  bulkMoveInitiatives: (ids: string[], dimension: DimensionKey, horizon: 'near' | 'far') => void;
  bulkDeleteInitiatives: (ids: string[]) => void;

  // Import
  importState: (state: Partial<AppState>) => void;

  // Template
  loadTemplate: (template: IndustryTemplate) => void;
  addCapabilities: (caps: Capability[]) => void;
}

const defaultUI: UIState = {
  selectedItem: null,
  view: 'roadmap',
  capabilityView: 'maturity',
  simulationEnabled: false,
  criticalPathEnabled: false,
  filters: {
    dimensions: [],
    horizon: 'all',
    owner: '',
    search: '',
    status: '',
    showMilestones: true,
    focusMode: false,
    zoomLevel: 1,
    spotlightValueChain: null,
  },
  editingId: null,
  addModalOpen: false,
  addModalTab: 'initiative',
  addModalDefaults: null,
  importModalOpen: false,
  presentationMode: false,
  presentationSlide: 0,
  compareScenario: null,
  insightsExpanded: false,
  selectedItems: new Set<string>(),
  filterDropdownOpen: false,
  capabilityOverlayOpen: false,
  roleMode: 'work',
};

export const useStore = create<StoreState>()(
  persist(
    temporal(
    (set) => {
      const defaults = createDefaultState();

      return {
        ...defaults,
        comments: [],
        snapshots: [],
        ui: defaultUI,

        // Initiative CRUD
        addInitiative: (initiative) => set(state => {
          const scenarioState = state.scenarioStates[state.activeScenario];
          return {
            scenarioStates: {
              ...state.scenarioStates,
              [state.activeScenario]: {
                initiatives: [...scenarioState.initiatives, initiative],
              },
            },
          };
        }),

        updateInitiative: (id, updates) => set(state => {
          const scenarioState = state.scenarioStates[state.activeScenario];
          return {
            scenarioStates: {
              ...state.scenarioStates,
              [state.activeScenario]: {
                initiatives: scenarioState.initiatives.map(i =>
                  i.id === id ? { ...i, ...updates } : i
                ),
              },
            },
          };
        }),

        deleteInitiative: (id) => set(state => {
          const scenarioState = state.scenarioStates[state.activeScenario];
          return {
            scenarioStates: {
              ...state.scenarioStates,
              [state.activeScenario]: {
                initiatives: scenarioState.initiatives
                  .filter(i => i.id !== id)
                  .map(i => ({
                    ...i,
                    dependsOn: i.dependsOn.filter(d => d !== id),
                  })),
              },
            },
            effects: state.effects.map(e => ({
              ...e,
              initiatives: e.initiatives.filter(iid => iid !== id),
            })),
            ui: { ...state.ui, selectedItem: state.ui.selectedItem?.id === id ? null : state.ui.selectedItem },
          };
        }),

        moveInitiative: (id, dimension, horizon, newOrder) => set(state => {
          const scenarioState = state.scenarioStates[state.activeScenario];
          const reordered = reorderInitiatives(scenarioState.initiatives, id, dimension, horizon, newOrder);
          if (!reordered) return state;
          return {
            scenarioStates: {
              ...state.scenarioStates,
              [state.activeScenario]: { initiatives: reordered },
            },
          };
        }),

        // Capability CRUD
        addCapability: (capability) => set(state => ({
          capabilities: [...state.capabilities, capability],
        })),

        updateCapability: (id, updates) => set(state => ({
          capabilities: state.capabilities.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

        deleteCapability: (id) => set(state => {
          const childIds = state.capabilities.filter(c => c.parent === id).map(c => c.id);
          const allIds = [id, ...childIds];
          const newScenarioStates: Record<string, { initiatives: Initiative[] }> = {};
          for (const [sid, ss] of Object.entries(state.scenarioStates)) {
            newScenarioStates[sid] = {
              initiatives: ss.initiatives.map(i => ({
                ...i,
                capabilities: i.capabilities.filter(cid => !allIds.includes(cid)),
                maturityEffect: Object.fromEntries(
                  Object.entries(i.maturityEffect).filter(([k]) => !allIds.includes(k))
                ),
              })),
            };
          }
          return {
            capabilities: state.capabilities.filter(c => !allIds.includes(c.id)),
            scenarioStates: newScenarioStates,
            effects: state.effects.map(e => ({
              ...e,
              capabilities: e.capabilities.filter(cid => !allIds.includes(cid)),
            })),
            ui: {
              ...state.ui,
              selectedItem: state.ui.selectedItem && allIds.includes(state.ui.selectedItem.id) ? null : state.ui.selectedItem,
            },
          };
        }),

        // Scenario CRUD
        addScenario: (scenario, cloneFrom) => set(state => {
          const baseInitiatives = cloneFrom
            ? (state.scenarioStates[cloneFrom]?.initiatives ?? []).map(i => ({
                ...i,
                id: `${i.id}_${scenario.id}`,
                dependsOn: i.dependsOn.map(d => `${d}_${scenario.id}`),
              }))
            : [];
          return {
            scenarios: [...state.scenarios, scenario],
            scenarioStates: {
              ...state.scenarioStates,
              [scenario.id]: { initiatives: baseInitiatives },
            },
          };
        }),

        updateScenario: (id, updates) => set(state => ({
          scenarios: state.scenarios.map(s => s.id === id ? { ...s, ...updates } : s),
        })),

        deleteScenario: (id) => set(state => {
          if (state.scenarios.length <= 1) return state;
          const newScenarios = state.scenarios.filter(s => s.id !== id);
          const { [id]: _, ...rest } = state.scenarioStates;
          return {
            scenarios: newScenarios,
            scenarioStates: rest,
            activeScenario: state.activeScenario === id ? newScenarios[0].id : state.activeScenario,
          };
        }),

        setActiveScenario: (id) => set({ activeScenario: id }),

        // Milestone CRUD
        addMilestone: (milestone) => set(state => ({
          milestones: [...state.milestones, milestone],
        })),
        updateMilestone: (id, updates) => set(state => ({
          milestones: state.milestones.map(m => m.id === id ? { ...m, ...updates } : m),
        })),
        deleteMilestone: (id) => set(state => ({
          milestones: state.milestones.filter(m => m.id !== id),
        })),

        // Value Chain CRUD
        addValueChain: (vc) => set(state => ({
          valueChains: [...state.valueChains, vc],
        })),
        updateValueChain: (id, updates) => set(state => ({
          valueChains: state.valueChains.map(v => v.id === id ? { ...v, ...updates } : v),
        })),
        deleteValueChain: (id) => set(state => {
          const newScenarioStates: Record<string, { initiatives: Initiative[] }> = {};
          for (const [sid, ss] of Object.entries(state.scenarioStates)) {
            newScenarioStates[sid] = {
              initiatives: ss.initiatives.map(i => ({
                ...i,
                valueChains: i.valueChains.filter(v => v !== id),
              })),
            };
          }
          return {
            valueChains: state.valueChains.filter(v => v.id !== id),
            scenarioStates: newScenarioStates,
          };
        }),

        // Effect CRUD
        addEffect: (effect) => set(state => ({
          effects: [...state.effects, effect],
        })),
        updateEffect: (id, updates) => set(state => ({
          effects: state.effects.map(e =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
        deleteEffect: (id) => set(state => ({
          effects: state.effects.filter(e => e.id !== id),
          ui: { ...state.ui, selectedItem: state.ui.selectedItem?.id === id ? null : state.ui.selectedItem },
        })),

        // Comments
        addComment: (comment) => set(state => ({
          comments: [...state.comments, comment],
        })),
        deleteComment: (id) => set(state => ({
          comments: state.comments.filter(c => c.id !== id),
        })),

        // Snapshots
        saveSnapshot: (label) => set(state => {
          const { ui: _ui, snapshots, ...appState } = state;
          const snapshot: Snapshot = {
            id: `snap_${Date.now()}`,
            timestamp: new Date().toISOString(),
            label,
            data: { ...appState, snapshots: [] } as AppState,
          };
          const newSnapshots = [snapshot, ...snapshots].slice(0, 20);
          return { snapshots: newSnapshots };
        }),

        restoreSnapshot: (id) => set(state => {
          const snapshot = state.snapshots.find(s => s.id === id);
          if (!snapshot) return state;
          // Auto-backup before restore
          const { ui: _ui, snapshots: _snapshotsBackup, ...currentState } = state;
          const backup: Snapshot = {
            id: `snap_backup_${Date.now()}`,
            timestamp: new Date().toISOString(),
            label: 'Auto-backup før gjenoppretting',
            data: { ...currentState, snapshots: [] } as AppState,
          };
          return {
            ...snapshot.data,
            snapshots: [backup, ...state.snapshots].slice(0, 20),
          };
        }),

        deleteSnapshot: (id) => set(state => ({
          snapshots: state.snapshots.filter(s => s.id !== id),
        })),

        // UI actions
        setSelectedItem: (item) => set(state => ({
          ui: { ...state.ui, selectedItem: item, editingId: null },
        })),
        setView: (view) => set(state => ({
          ui: { ...state.ui, view, compareScenario: view !== 'compare' ? null : state.ui.compareScenario },
        })),
        setCapabilityView: (capabilityView) => set(state => ({
          ui: { ...state.ui, capabilityView },
        })),
        toggleSimulation: () => set(state => ({
          ui: { ...state.ui, simulationEnabled: !state.ui.simulationEnabled },
        })),
        toggleCriticalPath: () => set(state => ({
          ui: { ...state.ui, criticalPathEnabled: !state.ui.criticalPathEnabled },
        })),
        setFilter: (filters) => set(state => ({
          ui: { ...state.ui, filters: { ...state.ui.filters, ...filters } },
        })),
        resetFilters: () => set(state => ({
          ui: { ...state.ui, filters: defaultUI.filters },
        })),
        setEditingId: (editingId) => set(state => ({
          ui: { ...state.ui, editingId },
        })),
        setAddModalOpen: (open, tab, defaults) => set(state => ({
          ui: {
            ...state.ui,
            addModalOpen: open,
            addModalTab: tab ?? state.ui.addModalTab,
            addModalDefaults: open ? (defaults ?? null) : null,
          },
        })),
        setImportModalOpen: (open) => set(state => ({
          ui: { ...state.ui, importModalOpen: open },
        })),
        setPresentationMode: (active) => set(state => ({
          ui: { ...state.ui, presentationMode: active, presentationSlide: 0 },
        })),
        setPresentationSlide: (slide) => set(state => ({
          ui: { ...state.ui, presentationSlide: slide },
        })),
        setCompareScenario: (id) => set(state => ({
          ui: { ...state.ui, compareScenario: id },
        })),
        setInsightsExpanded: (expanded) => set(state => ({
          ui: { ...state.ui, insightsExpanded: expanded },
        })),
        setFilterDropdownOpen: (open) => set(state => ({
          ui: { ...state.ui, filterDropdownOpen: open },
        })),
        setCapabilityOverlayOpen: (open) => set(state => ({
          ui: { ...state.ui, capabilityOverlayOpen: open },
        })),
        setRoleMode: (mode) => set(state => ({
          ui: { ...state.ui, roleMode: mode },
        })),

        // Bulk operations
        toggleSelectedItem: (id) => set(state => {
          const next = new Set(state.ui.selectedItems);
          if (next.has(id)) next.delete(id); else next.add(id);
          return { ui: { ...state.ui, selectedItems: next } };
        }),
        clearSelectedItems: () => set(state => ({
          ui: { ...state.ui, selectedItems: new Set<string>() },
        })),
        bulkMoveInitiatives: (ids, dimension, horizon) => set(state => {
          const scenarioState = state.scenarioStates[state.activeScenario];
          const initiatives = scenarioState.initiatives.map(i =>
            ids.includes(i.id) ? { ...i, dimension, horizon } : i
          );
          return {
            scenarioStates: {
              ...state.scenarioStates,
              [state.activeScenario]: { initiatives },
            },
            ui: { ...state.ui, selectedItems: new Set<string>() },
          };
        }),
        bulkDeleteInitiatives: (ids) => set(state => {
          const idSet = new Set(ids);
          const scenarioState = state.scenarioStates[state.activeScenario];
          return {
            scenarioStates: {
              ...state.scenarioStates,
              [state.activeScenario]: {
                initiatives: scenarioState.initiatives
                  .filter(i => !idSet.has(i.id))
                  .map(i => ({
                    ...i,
                    dependsOn: i.dependsOn.filter(d => !idSet.has(d)),
                  })),
              },
            },
            ui: {
              ...state.ui,
              selectedItems: new Set<string>(),
              selectedItem: state.ui.selectedItem && idSet.has(state.ui.selectedItem.id) ? null : state.ui.selectedItem,
            },
          };
        }),

        // Import
        importState: (imported) => set(state => {
          // Auto-backup
          const { ui: _ui, snapshots: _snapshotsImport, ...currentState } = state;
          const backup: Snapshot = {
            id: `snap_import_${Date.now()}`,
            timestamp: new Date().toISOString(),
            label: 'Auto-backup før import',
            data: { ...currentState, snapshots: [] } as AppState,
          };
          return {
            ...imported,
            snapshots: [backup, ...state.snapshots].slice(0, 20),
          };
        }),

        // Template
        loadTemplate: (template) => set(state => {
          const { ui: _ui, snapshots: _snapshotsTemplate, ...currentState } = state;
          const backup: Snapshot = {
            id: `snap_template_${Date.now()}`,
            timestamp: new Date().toISOString(),
            label: 'Auto-backup før mal',
            data: { ...currentState, snapshots: [] } as AppState,
          };
          const defaultScenarioId = 'default';
          return {
            capabilities: template.capabilities,
            scenarios: [{ id: defaultScenarioId, name: 'Hovedscenario', color: '#6366f1' }],
            scenarioStates: {
              [defaultScenarioId]: { initiatives: template.sampleInitiatives },
            },
            activeScenario: defaultScenarioId,
            milestones: [],
            valueChains: template.valueChains,
            effects: template.effects,
            snapshots: [backup, ...state.snapshots].slice(0, 20),
          };
        }),

        addCapabilities: (caps) => set(state => ({
          capabilities: [...state.capabilities, ...caps],
        })),
      };
    },
    {
      limit: 50,
      partialize: (state) => {
        const { ui: _ui, ...rest } = state;
        return rest as Omit<StoreState, 'ui'>;
      },
    }
  ),
  {
    name: 'cairn-storage',
    partialize: (state) => {
      const { ui: _uiPartialize, ...rest } = state;
      return { ...rest, ui: { filters: state.ui.filters, roleMode: state.ui.roleMode } };
    },
    merge: (persistedState, currentState) => {
      const persisted = (persistedState ?? {}) as Partial<StoreState>;
      const { ui: persistedUI, ...persistedRest } = persisted as Record<string, unknown>;
      return {
        ...currentState,
        ...persistedRest,
        effects: Array.isArray(persisted.effects) ? persisted.effects : currentState.effects,
        ui: {
          ...currentState.ui,
          ...(typeof persistedUI === 'object' && persistedUI !== null ? persistedUI : {}),
          selectedItems: currentState.ui.selectedItems,  // Always keep the Set
        },
      } as StoreState;
    },
  })
);
