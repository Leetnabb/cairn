import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useStore } from '../../stores/useStore';
import { StepWelcome } from './StepWelcome';
import { StepUpload } from './StepUpload';
import { StepAnalysis } from './StepAnalysis';
import { StepGenerated } from './StepGenerated';
import { StepInsights } from './StepInsights';
import type { Initiative, Effect, Scenario, AppState } from '../../types';
import type { OnboardingResult } from '../../lib/ai/frameworks/onboardingFramework';

function convertToAppState(result: OnboardingResult, scenarioName: string): Partial<AppState> {
  const scenarioId = crypto.randomUUID();

  const initiatives: Initiative[] = result.initiatives.map((init, order) => ({
    id: crypto.randomUUID(),
    name: init.name,
    dimension: init.dimension,
    horizon: init.horizon,
    order,
    description: init.description,
    capabilities: [],
    owner: '',
    dependsOn: [],
    maturityEffect: {},
    notes: '',
    valueChains: [],
  }));

  const effects: Effect[] = result.effects.map((e, order) => ({
    id: crypto.randomUUID(),
    name: e.name,
    description: e.description,
    type: e.type,
    capabilities: [],
    initiatives: [],
    order,
  }));

  const scenario: Scenario = {
    id: scenarioId,
    name: scenarioName,
    color: '#6366f1',
  };

  return {
    strategies: [],
    capabilities: [],
    scenarios: [scenario],
    scenarioStates: { [scenarioId]: { initiatives } },
    activeScenario: scenarioId,
    effects,
    milestones: [],
    valueChains: [],
    modules: { roadmap: true, capabilities: true, effects: true },
  };
}

export function OnboardingWizard() {
  const { t } = useTranslation();
  const isOpen = useOnboardingStore(s => s.isOpen);
  const step = useOnboardingStore(s => s.step);
  const close = useOnboardingStore(s => s.close);
  const onboardingResult = useOnboardingStore(s => s.onboardingResult);
  const completeOnboarding = useOnboardingStore(s => s.completeOnboarding);

  const importState = useStore(s => s.importState);
  const setComplexityLevel = useStore(s => s.setComplexityLevel);
  const setModules = useStore(s => s.setModules);

  if (!isOpen) return null;

  const steps = [
    { label: t('onboarding.stepWelcome') },
    { label: t('onboarding.upload.title') },
    { label: t('onboarding.analysis.title') },
    { label: t('onboarding.generated.title') },
    { label: t('onboarding.insights.title') },
  ];

  const handleComplete = () => {
    if (onboardingResult) {
      const appState = convertToAppState(onboardingResult, t('scenario.default', 'Hovedscenario'));
      importState(appState);
      setComplexityLevel(1);
      setModules({ roadmap: true, capabilities: true, effects: true });
    }
    completeOnboarding();
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepWelcome />;
      case 1: return <StepUpload />;
      case 2: return <StepAnalysis />;
      case 3: return <StepGenerated />;
      case 4: return <StepInsights onComplete={handleComplete} />;
      default: return <StepWelcome />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={close}>
      <div
        className="bg-card rounded-xl shadow-xl w-[540px] max-h-[88vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-colors ${
                i === step
                  ? 'bg-primary text-white'
                  : i < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-[var(--bg-hover)] text-text-tertiary'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`ml-1.5 text-[10px] font-medium hidden sm:block ${
                i === step ? 'text-primary' : 'text-text-tertiary'
              }`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-4 h-px mx-2 ${i < step ? 'bg-primary/30' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
          <button
            onClick={close}
            className="ml-2 p-1 text-text-tertiary hover:text-text-primary hover:bg-[var(--bg-hover)] rounded transition-colors shrink-0"
            title={t('common.close')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
