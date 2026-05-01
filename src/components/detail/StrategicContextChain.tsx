import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative, StrategicGoal, StrategicTheme, Effect } from '../../types';
import { EFFECT_TYPE_COLORS } from '../../types';

interface Props {
  initiative: Initiative;
  goals: StrategicGoal[];
  themes: StrategicTheme[];
  effects: Effect[];
  onSelectGoal: (id: string) => void;
  onSelectEffect: (id: string) => void;
}

export function StrategicContextChain({
  initiative,
  goals,
  themes,
  effects,
  onSelectGoal,
  onSelectEffect,
}: Props) {
  const { t } = useTranslation();

  const relatedThemes = useMemo(
    () => themes.filter(th => initiative.themeIds?.includes(th.id)),
    [themes, initiative.themeIds]
  );

  const relatedGoals = useMemo(() => {
    const goalIds = new Set<string>();
    for (const theme of relatedThemes) {
      for (const gid of theme.goalIds ?? []) {
        goalIds.add(gid);
      }
    }
    return goals.filter(g => goalIds.has(g.id));
  }, [relatedThemes, goals]);

  const relatedEffects = useMemo(
    () => effects.filter(e => e.initiatives.includes(initiative.id)),
    [effects, initiative.id]
  );

  const hasAnyContext = relatedGoals.length > 0 || relatedThemes.length > 0 || relatedEffects.length > 0;

  if (!hasAnyContext) return null;

  return (
    <div className="rounded border border-indigo-100 bg-indigo-50/50 p-2.5 space-y-2">
      <div className="text-[8px] font-semibold uppercase tracking-wider text-indigo-500">
        {t('strategicContext.title')}
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Goals */}
        {relatedGoals.length > 0 && (
          <ChainRow label={t('strategicContext.goal')}>
            {relatedGoals.map(g => (
              <ChainChip
                key={g.id}
                label={g.name}
                color="indigo"
                onClick={() => onSelectGoal(g.id)}
              />
            ))}
          </ChainRow>
        )}

        {/* Arrow divider */}
        {relatedGoals.length > 0 && relatedThemes.length > 0 && <ChainArrow />}

        {/* Themes / Satsingsområder */}
        {relatedThemes.length > 0 && (
          <ChainRow label={t('strategicContext.theme')}>
            {relatedThemes.map(th => (
              <ChainChip
                key={th.id}
                label={th.name}
                color="violet"
                onClick={() => {}}
              />
            ))}
          </ChainRow>
        )}

        {/* Arrow divider */}
        {relatedThemes.length > 0 && <ChainArrow />}

        {/* This initiative */}
        <ChainRow label={t('strategicContext.initiative')}>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-800 text-white">
            {initiative.name}
          </span>
        </ChainRow>

        {/* Arrow divider */}
        {relatedEffects.length > 0 && <ChainArrow />}

        {/* Effects */}
        {relatedEffects.length > 0 && (
          <ChainRow label={t('strategicContext.effects')}>
            {relatedEffects.map(e => (
              <button
                key={e.id}
                onClick={() => onSelectEffect(e.id)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium text-white hover:opacity-80 transition-opacity"
                style={{ backgroundColor: EFFECT_TYPE_COLORS[e.type] }}
              >
                {e.name}
              </button>
            ))}
          </ChainRow>
        )}
      </div>
    </div>
  );
}

function ChainRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[8px] text-text-tertiary uppercase w-16 shrink-0 pt-1">{label}</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function ChainChip({ label, color, onClick }: { label: string; color: 'indigo' | 'violet'; onClick: () => void }) {
  const colorClass = color === 'indigo'
    ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
    : 'bg-violet-100 text-violet-800 hover:bg-violet-200';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors ${colorClass}`}
    >
      {label}
    </button>
  );
}

function ChainArrow() {
  return (
    <div className="flex items-center pl-[4.5rem]">
      <svg className="w-3 h-3 text-indigo-300" viewBox="0 0 12 12" fill="none">
        <path d="M6 1v10M6 11l-3-3M6 11l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
