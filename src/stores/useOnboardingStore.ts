import { create } from 'zustand';
import type { Capability } from '../types';

export interface SuggestedCapability extends Capability {
  reasoning: string;
  selected: boolean;
}

interface OnboardingState {
  isOpen: boolean;
  step: number; // 0=welcome, 1=template, 2=ai-suggestions, 3=review
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

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isOpen: false,
  step: 0,
  orgDescription: '',
  selectedTemplateId: null,
  suggestedCapabilities: [],
  isLoadingSuggestions: false,
  suggestionError: null,
  hasCompletedOnboarding: localStorage.getItem(ONBOARDING_KEY) === 'completed',

  openWizard: () => set({ isOpen: true, step: 0 }),
  closeWizard: () => set({ isOpen: false }),
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 3) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
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
    orgDescription: '',
    selectedTemplateId: null,
    suggestedCapabilities: [],
    isLoadingSuggestions: false,
    suggestionError: null,
  }),
}));

/** Should auto-show wizard? Only if no onboarding done AND no existing data */
export function shouldAutoShowWizard(): boolean {
  const onboardingDone = localStorage.getItem(ONBOARDING_KEY);
  const hasExistingData = localStorage.getItem('cairn-storage');
  return !onboardingDone && !hasExistingData;
}
