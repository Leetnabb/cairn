import { create } from 'zustand';
import type { GeneratedStrategicPicture } from '../lib/ai/generateStrategicPicture';

interface OnboardingState {
  isOpen: boolean;
  step: number; // 0: Welcome, 1: Upload/Describe, 2: Generated picture, 3: Insights
  orgDescription: string;
  uploadedFiles: Array<{ name: string; text: string }>;
  generatedPicture: GeneratedStrategicPicture | null;
  isGenerating: boolean;
  generationError: string | null;
  hasCompletedOnboarding: boolean;

  open: () => void;
  close: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setOrgDescription: (desc: string) => void;
  addUploadedFiles: (files: Array<{ name: string; text: string }>) => void;
  removeUploadedFile: (name: string) => void;
  setGeneratedPicture: (picture: GeneratedStrategicPicture) => void;
  setIsGenerating: (loading: boolean) => void;
  setGenerationError: (error: string | null) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isOpen: shouldAutoShowWizard(),
  step: 0,
  orgDescription: '',
  uploadedFiles: [],
  generatedPicture: null,
  isGenerating: false,
  generationError: null,
  hasCompletedOnboarding: localStorage.getItem('cairn-onboarding') === 'completed',

  open: () => set({ isOpen: true, step: 0 }),
  close: () => set({ isOpen: false }),
  nextStep: () => set(s => ({ step: Math.min(s.step + 1, 3) })),
  prevStep: () => set(s => ({ step: Math.max(s.step - 1, 0) })),
  setOrgDescription: (orgDescription) => set({ orgDescription }),
  addUploadedFiles: (files) => set((s) => {
    const updated = [...s.uploadedFiles];
    for (const file of files) {
      const idx = updated.findIndex(f => f.name === file.name);
      if (idx >= 0) {
        updated[idx] = file;
      } else {
        updated.push(file);
      }
    }
    return { uploadedFiles: updated };
  }),
  removeUploadedFile: (name) => set((s) => ({
    uploadedFiles: s.uploadedFiles.filter(f => f.name !== name),
  })),
  setGeneratedPicture: (generatedPicture) => set({ generatedPicture }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationError: (generationError) => set({ generationError }),
  completeOnboarding: () => {
    localStorage.setItem('cairn-onboarding', 'completed');
    set({ hasCompletedOnboarding: true, isOpen: false });
  },
  reset: () => set({
    step: 0, orgDescription: '', uploadedFiles: [],
    generatedPicture: null, isGenerating: false, generationError: null,
  }),
}));

function shouldAutoShowWizard(): boolean {
  if (localStorage.getItem('cairn-onboarding') === 'completed') return false;
  if (localStorage.getItem('cairn-storage')) return false;
  return true;
}
