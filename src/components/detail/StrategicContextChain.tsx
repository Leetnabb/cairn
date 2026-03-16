import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Initiative, Capability, Strategy, Effect } from '../../types';
import { EFFECT_TYPE_COLORS } from '../../types';

interface Props {
  initiative: Initiative;
  capabilities: Capability[];
  strategies: Strategy[];
  effects: Effect[];
  onSelectStrategy: (id: string) => void;
  onSelectCapability: (id: string) => void;
  onSelectEffect: (id: string) => void;
}

export function StrategicContextChain({
  initiative,
  capabilities,
  strategies,
  effects,
  onSelectStrategy,
  onSelectCapability,
  onSelectEffect,
}: Props) {
  const { t } = useTranslation();

  const relatedCaps = useMemo(
    () => capabilities.filter(c => initiative.capabilities.includes(c.id)),
    [capabilities, initiative.capabilities]
  );

  const relatedStrategies = useMemo(() => {
    const ids = new Set<string>();
    for (const cap of relatedCaps) {
      for (const sid of cap.strategyIds ?? []) {
        ids.add(sid);
      }
    }
    return strategies.filter(s => ids.has(s.id));
  }, [relatedCaps, strategies]);

  const relatedEffects = useMemo(
    () => effects.filter(e => e.initiatives.includes(initiative.id)),
    [effects, initiative.id]
  );

  const hasAnyContext = relatedStrategies.length > 0 || relatedCaps.length > 0 || relatedEffects.length > 0;

  if (!hasAnyContext) return null;

  return (
    <div className="rounded border border-indigo-100 bg-indigo-50/50 p-2.5 space-y-2">
      <div className="text-[8px] font-semibold uppercase tracking-wider text-indigo-500">
        {t('strategicContext.title')}
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Strategies */}
        {relatedStrategies.length > 0 && (
          <ChainRow label={t('strategicContext.strategy')}>
            {relatedStrategies.map(s => (
              <ChainChip
                key={s.id}
                label={s.name}
                color="indigo"
                onClick={() => onSelectStrategy(s.id)}
              />
            ))}
          </ChainRow>
        )}

        {/* Arrow divider */}
        {relatedStrategies.length > 0 && relatedCaps.length > 0 && <ChainArrow />}

        {/* Capabilities */}
        {relatedCaps.length > 0 && (
          <ChainRow label={t('strategicContext.capability')}>
            {relatedCaps.map(c => (
              <ChainChip
                key={c.id}
                label={c.name}
                color="violet"
                onClick={() => onSelectCapability(c.id)}
              />
            ))}
          </ChainRow>
        )}

        {/* Arrow divider */}
        {relatedCaps.length > 0 && <ChainArrow />}

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
