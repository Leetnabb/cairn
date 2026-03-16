import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { StepWelcome } from './StepWelcome';
import { StepModules } from './StepModules';
import { StepTemplate } from './StepTemplate';
import { StepAISuggestions } from './StepAISuggestions';
import { StepReview } from './StepReview';

export function OnboardingWizard() {
  const { t } = useTranslation();
  const isOpen = useOnboardingStore(s => s.isOpen);
  const step = useOnboardingStore(s => s.step);
  const selectedModules = useOnboardingStore(s => s.selectedModules);
  const closeWizard = useOnboardingStore(s => s.closeWizard);

  if (!isOpen) return null;

  // Build dynamic step list based on selected modules
  const steps: { label: string; component: React.ReactNode }[] = [
    { label: t('onboarding.stepWelcome'), component: <StepWelcome /> },
    { label: t('onboarding.stepModules'), component: <StepModules /> },
  ];

  if (selectedModules.capabilities) {
    steps.push({ label: t('onboarding.stepTemplate'), component: <StepTemplate /> });
    steps.push({ label: t('onboarding.stepAI'), component: <StepAISuggestions /> });
    steps.push({ label: t('onboarding.stepReview'), component: <StepReview /> });
  }

  const currentStep = steps[step] ?? steps[steps.length - 1];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeWizard}>
      <div
        className="bg-white rounded-xl shadow-xl w-[520px] max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-colors ${
                i === step
                  ? 'bg-primary text-white'
                  : i < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-gray-100 text-text-tertiary'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`ml-1.5 text-[10px] font-medium ${
                i === step ? 'text-primary' : 'text-text-tertiary'
              }`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-6 h-px mx-2 ${i < step ? 'bg-primary/30' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
          <button
            onClick={closeWizard}
            className="ml-2 p-1 text-text-tertiary hover:text-text-primary hover:bg-gray-100 rounded transition-colors"
            title={t('common.close')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-64px)]">
          {currentStep.component}
        </div>
      </div>
    </div>
  );
}
