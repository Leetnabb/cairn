import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useStore } from '../../stores/useStore';
import type { ModuleSettings } from '../../types';

const MODULES: {
  key: keyof ModuleSettings;
  icon: string;
  titleKey: string;
  descKey: string;
  recommended?: boolean;
  locked?: boolean;
}[] = [
  {
    key: 'roadmap',
    icon: '🗺️',
    titleKey: 'modules.roadmap',
    descKey: 'modules.roadmapDesc',
    recommended: true,
    locked: true, // Roadmap is always on – it's the core
  },
  {
    key: 'capabilities',
    icon: '🏗️',
    titleKey: 'modules.capabilities',
    descKey: 'modules.capabilitiesDesc',
  },
  {
    key: 'effects',
    icon: '🎯',
    titleKey: 'modules.effects',
    descKey: 'modules.effectsDesc',
  },
];

export function StepModules() {
  const { t } = useTranslation();
  const selectedModules = useOnboardingStore(s => s.selectedModules);
  const setSelectedModules = useOnboardingStore(s => s.setSelectedModules);
  const nextStep = useOnboardingStore(s => s.nextStep);
  const prevStep = useOnboardingStore(s => s.prevStep);
  const completeOnboarding = useOnboardingStore(s => s.completeOnboarding);
  const setModules = useStore(s => s.setModules);

  const toggle = (key: keyof ModuleSettings) => {
    if (key === 'roadmap') return; // locked
    setSelectedModules({ ...selectedModules, [key]: !selectedModules[key] });
  };

  // If no capabilities selected: skip remaining steps and start immediately
  const handleContinue = () => {
    if (!selectedModules.capabilities) {
      setModules(selectedModules);
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-primary">{t('modules.stepTitle')}</h2>
        <p className="text-[12px] text-text-secondary mt-1">{t('modules.stepSubtitle')}</p>
      </div>

      <div className="space-y-2">
        {MODULES.map(mod => {
          const active = selectedModules[mod.key];
          return (
            <button
              key={mod.key}
              onClick={() => toggle(mod.key)}
              disabled={mod.locked}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 ${
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-gray-300 bg-white'
              } ${mod.locked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{mod.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-text-primary">
                      {t(mod.titleKey)}
                    </span>
                    {mod.recommended && (
                      <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-primary text-white uppercase tracking-wide">
                        {t('modules.recommended')}
                      </span>
                    )}
                    {mod.locked && (
                      <span className="text-[8px] text-text-tertiary italic">
                        {t('modules.core')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5">{t(mod.descKey)}</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  active ? 'border-primary bg-primary' : 'border-gray-300'
                }`}>
                  {active && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-text-tertiary text-center">{t('modules.addLater')}</p>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-4 py-2 text-[11px] font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
        >
          &larr; {t('common.back')}
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2 text-[12px] font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          {selectedModules.capabilities ? `${t('common.continue')} →` : t('onboarding.startNow')}
        </button>
      </div>
    </div>
  );
}
