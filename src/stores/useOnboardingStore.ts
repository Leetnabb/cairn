import { create } from 'zustand';
import type { Capability, ModuleSettings } from '../types';

export interface SuggestedCapability extends Capability {
  reasoning: string;
  selected: boolean;
}

interface OnboardingState {
  isOpen: boolean;
  step: number; // 0=welcome, 1=modules, 2=template, 3=ai-suggestions (caps only), 4=review
  selectedModules: ModuleSettings;
  orgDescription: string;
  selectedTemplateId: string | null;
  suggestedCapabilities: SuggestedCapability[];
  isLoadingSuggestions: boolean;
  suggestionError: string | null;
  hasCompletedOnboarding: boolean;

  // Actions
  openWizard: () => void;
  closeWizard: () => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSelectedModules: (modules: ModuleSettings) => void;
  setOrgDescription: (desc: string) => void;
  setSelectedTemplateId: (id: string) => void;
  setSuggestedCapabilities: (caps: SuggestedCapability[]) => void;
  toggleSuggestedCapability: (id: string) => void;
  setIsLoadingSuggestions: (loading: boolean) => void;
  setSuggestionError: (error: string | null) => void;
  completeOnboarding: () => void;
  resetWizard: () => void;
}

const ONBOARDING_KEY = 'cairn-onboarding';

// Returns the max step index based on selected modules
function maxStep(modules: ModuleSettings): number {
  // Without capabilities: Welcome → Modules → done (step 2 = complete immediately)
  // With capabilities: Welcome → Modules → Template → AI → Review (step 4)
  return modules.capabilities ? 4 : 1;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isOpen: false,
  step: 0,
  selectedModules: { roadmap: true, capabilities: false, effects: false },
  orgDescription: '',
  selectedTemplateId: null,
  suggestedCapabilities: [],
  isLoadingSuggestions: false,
  suggestionError: null,
  hasCompletedOnboarding: localStorage.getItem(ONBOARDING_KEY) === 'completed',

  openWizard: () => set({ isOpen: true, step: 0 }),
  closeWizard: () => set({ isOpen: false }),
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, maxStep(s.selectedModules)) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  setSelectedModules: (selectedModules) => set({ selectedModules }),
  setOrgDescription: (orgDescription) => set({ orgDescription }),
  setSelectedTemplateId: (selectedTemplateId) => set({ selectedTemplateId }),
  setSuggestedCapabilities: (suggestedCapabilities) => set({ suggestedCapabilities }),
  toggleSuggestedCapability: (id) => set((s) => ({
    suggestedCapabilities: s.suggestedCapabilities.map(c =>
      c.id === id ? { ...c, selected: !c.selected } : c
    ),
  })),
  setIsLoadingSuggestions: (isLoadingSuggestions) => set({ isLoadingSuggestions }),
  setSuggestionError: (suggestionError) => set({ suggestionError }),
  completeOnboarding: () => {
    localStorage.setItem(ONBOARDING_KEY, 'completed');
    set({ hasCompletedOnboarding: true, isOpen: false });
  },
  resetWizard: () => set({
    step: 0,
    selectedModules: { roadmap: true, capabilities: false, effects: false },
    orgDescription: '',
    selectedTemplateId: null,
    suggestedCapabilities: [],
    isLoadingSuggestions: false,
    suggestionError: null,
  }),

  // Exposed for StepModules to check
  get maxStep() { return maxStep(get().selectedModules); },
}));

/** Should auto-show wizard? Only if no onboarding done AND no existing data */
export function shouldAutoShowWizard(): boolean {
  const onboardingDone = localStorage.getItem(ONBOARDING_KEY);
  const hasExistingData = localStorage.getItem('cairn-storage');
  return !onboardingDone && !hasExistingData;
}
