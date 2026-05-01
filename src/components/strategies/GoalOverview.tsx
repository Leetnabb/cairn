import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';

export function GoalOverview() {
  const { t } = useTranslation();
  const goals = useStore(s => s.strategicFrame?.goals ?? []);
  const themes = useStore(s => s.strategicFrame?.themes ?? []);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const effects = useStore(s => s.effects);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const setView = useStore(s => s.setView);

  const goalData = useMemo(() => {
    return goals.map(g => {
      const linkedThemes = themes.filter(th => g.themeIds.includes(th.id));
      const themeIds = new Set(g.themeIds);
      const linkedInits = initiatives.filter(i => i.themeIds?.some(tid => themeIds.has(tid)));
      const nearCount = linkedInits.filter(i => i.horizon === 'near').length;
      const farCount = linkedInits.filter(i => i.horizon === 'far').length;
      const linkedEffects = effects.filter(e => e.goalId === g.id);
      const hasActivity = linkedInits.length > 0;

      return { g, linkedThemes, linkedInits, nearCount, farCount, linkedEffects, hasActivity };
    });
  }, [goals, themes, initiatives, effects]);

  if (goals.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-[13px] text-text-tertiary mb-2">{t('goal.noGoals')}</p>
          <p className="text-[11px] text-text-tertiary">{t('goal.noGoalsHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-[13px] font-semibold text-text-primary mb-4">{t('goal.title')}</h2>
        <div className="space-y-3">
          {goalData.map(({ g, linkedThemes, linkedInits, nearCount, farCount, linkedEffects, hasActivity }) => (
            <div
              key={g.id}
              className="bg-card rounded-lg border border-border p-4 hover:border-primary/40 transition-colors"
            >
              {/* Header row */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={() => setSelectedItem({ type: 'goal', id: g.id })}
                    className="text-[14px] font-semibold text-text-primary hover:text-primary truncate text-left"
                  >
                    {g.name}
                  </button>
                </div>
                {!hasActivity && (
                  <span className="shrink-0 text-[9px] text-amber-600 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    {t('goal.noActivity')}
                  </span>
                )}
              </div>

              {/* Description */}
              {g.description && (
                <p className="text-[11px] text-text-secondary mb-3">{g.description}</p>
              )}

              {/* Linked themes */}
              {linkedThemes.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {linkedThemes.map(th => (
                    <span
                      key={th.id}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-violet-100 text-violet-800"
                    >
                      {th.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Effects */}
              {linkedEffects.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {linkedEffects.map(e => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedItem({ type: 'effect', id: e.id })}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                    >
                      {e.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Footer stats */}
              <div className="flex items-center gap-4 text-[9px] text-text-tertiary pt-2 border-t border-border/50">
                <span>{linkedInits.length} {t('dashboard.activities').toLowerCase()}</span>
                {nearCount > 0 && <span>{nearCount} {t('labels.horizon.near').toLowerCase()}</span>}
                {farCount > 0 && <span>{farCount} {t('labels.horizon.far').toLowerCase()}</span>}
                {linkedEffects.length > 0 && (
                  <span className="text-green-600">
                    {linkedEffects.length} {t('effects.title').toLowerCase()}
                  </span>
                )}
                <button
                  onClick={() => setView('roadmap')}
                  className="ml-auto text-primary hover:underline"
                >
                  {t('goal.viewInPath')} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
