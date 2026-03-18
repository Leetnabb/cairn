import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useStore } from '../../stores/useStore';
import { DIMENSIONS, DIMENSION_MAP, type DimensionKey } from '../../types';

interface StepInsightsProps {
  /** Optional override for the completion action. If not provided, falls back to completeOnboarding(). */
  onComplete?: () => void;
}

function InsightCard({ text }: { text: string }) {
  return (
    <div className="bg-surface-hover border border-border rounded-lg p-3">
      <div className="flex gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-[12px] text-text-secondary leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function StepInsights({ onComplete }: StepInsightsProps) {
  const { t } = useTranslation();
  const { generatedPicture, completeOnboarding } = useOnboardingStore();
  const enterMeetingMode = useStore(s => s.enterMeetingMode);

  const handleComplete = onComplete ?? completeOnboarding;

  const handleMeetingCta = () => {
    handleComplete();
    enterMeetingMode();
  };

  const handleEditCta = () => {
    handleComplete();
  };

  if (!generatedPicture) {
    return (
      <div className="py-8 text-center text-[12px] text-text-tertiary">
        {t('onboarding.insights.noData')}
      </div>
    );
  }

  const initiatives = generatedPicture.initiatives;
  const capabilities = generatedPicture.capabilities;

  // Dimension distribution
  const dimCounts = (['ledelse', 'virksomhet', 'organisasjon', 'teknologi'] as DimensionKey[]).map(key => ({
    key,
    count: initiatives.filter(i => i.dimension === key).length,
    color: DIMENSION_MAP[key].color,
    label: DIMENSION_MAP[key].label,
  }));
  const maxCount = Math.max(...dimCounts.map(d => d.count), 1);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-text-primary">{t('onboarding.insights.title')}</h2>
        <p className="text-[12px] text-text-secondary mt-1">{t('onboarding.insights.subtitle')}</p>
      </div>

      {/* Insights */}
      {generatedPicture.insights.length > 0 && (
        <div className="space-y-2">
          {generatedPicture.insights.map((insight, i) => (
            <InsightCard key={i} text={insight} />
          ))}
        </div>
      )}

      {/* Dimension distribution */}
      <div>
        <h3 className="text-[10px] font-bold text-text-tertiary uppercase mb-3">
          {t('onboarding.insights.dimensions')}
        </h3>
        <div className="space-y-2">
          {dimCounts.map(({ key, count, color, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-[11px] text-text-secondary w-24 shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex-1 bg-surface-hover rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">{capabilities.length}</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">{t('onboarding.insights.capCount')}</p>
        </div>
        <div className="flex-1 bg-surface-hover rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">{initiatives.length}</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">{t('onboarding.insights.initCount')}</p>
        </div>
        <div className="flex-1 bg-surface-hover rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            {DIMENSIONS.filter(d => dimCounts.find(dc => dc.key === d.key && dc.count > 0)).length}
          </p>
          <p className="text-[10px] text-text-tertiary mt-0.5">{t('onboarding.insights.dimCount')}</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-2 pt-1">
        <button
          onClick={handleMeetingCta}
          className="w-full px-4 py-2.5 text-[12px] font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          {t('onboarding.insights.meetingCta')}
        </button>
        <button
          onClick={handleEditCta}
          className="w-full px-4 py-2 text-[11px] font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-surface-hover transition-colors"
        >
          {t('onboarding.insights.editCta')}
        </button>
      </div>
    </div>
  );
}
