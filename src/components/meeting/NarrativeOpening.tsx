import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { generateNarrative } from '../../lib/narrativeEngine';
import { DIMENSIONS } from '../../types';

export function NarrativeOpening() {
  const { t } = useTranslation();
  const setMeetingLens = useStore(s => s.setMeetingLens);
  const activeScenario = useStore(s => s.activeScenario);
  const scenarioStates = useStore(s => s.scenarioStates);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);
  const strategicFrame = useStore(s => s.strategicFrame);

  const initiatives = scenarioStates[activeScenario]?.initiatives ?? [];
  const narrative = generateNarrative(initiatives, capabilities, effects, undefined, strategicFrame);

  // Split narrative into sentences for display
  const sentences = narrative
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  // Stats
  const nearCount = initiatives.filter(i => i.horizon === 'near').length;
  const farCount = initiatives.filter(i => i.horizon === 'far').length;
  const coveredDimensions = new Set(initiatives.map(i => i.dimension)).size;
  const totalDimensions = DIMENSIONS.length;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
      style={{ backgroundColor: 'var(--bg-app)' }}
      onClick={() => setMeetingLens('path')}
    >
      {/* Narrative text */}
      <div className="max-w-3xl px-12 text-center space-y-5">
        {sentences.map((sentence, i) => (
          <p
            key={i}
            className="font-serif leading-relaxed"
            style={{
              fontSize: i === 0 ? 32 : 26,
              color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            {sentence}
          </p>
        ))}
      </div>

      {/* Stats bar */}
      <div
        className="absolute bottom-20 flex items-center gap-8 text-sm font-body"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span>
          <span className="text-slate-300 font-medium">{initiatives.length}</span>{' '}
          {t('meeting.stats.initiatives')}
        </span>
        <span className="text-slate-600">·</span>
        <span>
          <span className="text-slate-300 font-medium">{nearCount}</span>{' '}
          {t('meeting.stats.near')}
          {' / '}
          <span className="text-slate-300 font-medium">{farCount}</span>{' '}
          {t('meeting.stats.far')}
        </span>
        <span className="text-slate-600">·</span>
        <span>
          <span className="text-slate-300 font-medium">{capabilities.length}</span>{' '}
          {t('meeting.stats.capabilities')}
        </span>
        <span className="text-slate-600">·</span>
        <span>
          <span className="text-slate-300 font-medium">{coveredDimensions}/{totalDimensions}</span>{' '}
          {t('meeting.stats.dimensions')}
        </span>
      </div>

      {/* Click hint */}
      <div
        className="absolute bottom-8 text-xs tracking-widest uppercase animate-pulse font-body"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {t('meeting.clickToContinue')}
      </div>
    </div>
  );
}
