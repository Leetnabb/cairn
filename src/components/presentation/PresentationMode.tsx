import { useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSIONS, MATURITY_COLORS, RISK_COLORS } from '../../types';
import type { Capability, Effect, Initiative } from '../../types';
import { CairnLogo } from '../CairnLogo';
import { generateNarrative } from '../../lib/narrativeEngine';

const SLIDES = ['overview', 'strategies', 'capabilityMomentum', 'portfolio', 'bottlenecks', 'effects', 'strategicReading', 'summary'] as const;

function useSlideLabels() {
  const { t } = useTranslation();
  return useMemo(() => [
    t('presentation.slides.overview'),
    t('presentation.slides.strategies'),
    t('presentation.slides.capabilityMomentum'),
    t('presentation.slides.portfolio'),
    t('presentation.slides.bottlenecks'),
    t('presentation.slides.effects'),
    t('presentation.slides.strategicReading'),
    t('presentation.slides.summary'),
  ], [t]);
}

export function PresentationMode() {
  const SLIDE_LABELS = useSlideLabels();
  const slide = useStore(s => s.ui.presentationSlide);
  const setPresentationSlide = useStore(s => s.setPresentationSlide);
  const setPresentationMode = useStore(s => s.setPresentationMode);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);
  const strategies = useStore(s => s.strategies);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setPresentationMode(false);
    else if (e.key === 'ArrowRight' || e.key === ' ') setPresentationSlide(Math.min(slide + 1, SLIDES.length - 1));
    else if (e.key === 'ArrowLeft') setPresentationSlide(Math.max(slide - 1, 0));
  }, [slide, setPresentationSlide, setPresentationMode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentSlide = SLIDES[slide];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0f172a' }}>
      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-2 py-3">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPresentationSlide(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === slide ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={SLIDE_LABELS[idx]}
            aria-current={idx === slide ? 'true' : undefined}
            title={SLIDE_LABELS[idx]}
          />
        ))}
        <button
          onClick={() => setPresentationMode(false)}
          className="ml-4 px-2 py-0.5 text-[10px] text-white/50 hover:text-white/80 rounded border border-white/20"
        >
          Esc
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        {currentSlide === 'overview' && <OverviewSlide initiatives={initiatives} />}
        {currentSlide === 'strategies' && <StrategiesSlide strategies={strategies} capabilities={capabilities} initiatives={initiatives} />}
        {currentSlide === 'capabilityMomentum' && <CapabilityMomentumSlide capabilities={capabilities} initiatives={initiatives} />}
        {currentSlide === 'portfolio' && <PortfolioSlide initiatives={initiatives} capabilities={capabilities} />}
        {currentSlide === 'bottlenecks' && <BottlenecksSlide capabilities={capabilities} initiatives={initiatives} />}
        {currentSlide === 'effects' && <EffectSummarySlide effects={effects} initiatives={initiatives} />}
        {currentSlide === 'strategicReading' && <StrategicReadingSlide initiatives={initiatives} capabilities={capabilities} effects={effects} />}
        {currentSlide === 'summary' && <SummarySlide initiatives={initiatives} capabilities={capabilities} />}
      </div>

      {/* Slide label */}
      <div className="text-center pb-3">
        <span className="text-[11px] text-white/40">{SLIDE_LABELS[slide]} &middot; {slide + 1}/{SLIDES.length}</span>
      </div>
    </div>
  );
}

function OverviewSlide({ initiatives }: { initiatives: Initiative[] }) {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-5xl">
      <div className="mb-8">
        <CairnLogo size={1.5} dark={true} showTagline={true} />
      </div>
      <div className="space-y-3">
        {DIMENSIONS.map(dim => {
          const near = initiatives.filter(i => i.dimension === dim.key && i.horizon === 'near').sort((a, b) => a.order - b.order);
          const far = initiatives.filter(i => i.dimension === dim.key && i.horizon === 'far').sort((a, b) => a.order - b.order);
          return (
            <div key={dim.key} className="flex items-stretch gap-2">
              <div className="w-36 shrink-0 rounded-lg flex items-center px-4" style={{ backgroundColor: dim.color + '22' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dim.color }} />
                  <span className="text-[15px] font-semibold text-white">{t(`labels.dimensions.${dim.key}`)}</span>
                </div>
              </div>
              <div className="flex-1 flex gap-1.5">
                {near.map(i => (
                  <div key={i.id} className="px-3 py-2 rounded-lg border-l-[3px]" style={{ borderColor: dim.color, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="text-[13px] text-white font-medium">{i.name}</div>
                    <div className="text-[10px] text-white/50">{i.owner}</div>
                  </div>
                ))}
              </div>
              <div className="w-px bg-white/10 mx-1" />
              <div className="flex-1 flex gap-1.5">
                {far.map(i => (
                  <div key={i.id} className="px-3 py-2 rounded-lg border-l-[3px] border-dashed" style={{ borderColor: dim.color + '88', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-[13px] text-white/80 font-medium">{i.name}</div>
                    <div className="text-[10px] text-white/40">{i.owner}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-8 mt-6">
        <span className="text-[11px] text-white/40">&larr; {t('labels.horizon.nearRange')}</span>
        <span className="text-[11px] text-white/40">{t('labels.horizon.farRange')} &rarr;</span>
      </div>
    </div>
  );
}

function StrategiesSlide({ strategies, capabilities, initiatives }: { strategies: ReturnType<typeof useStore.getState>['strategies']; capabilities: Capability[]; initiatives: Initiative[] }) {
  const { t } = useTranslation();

  const strategyData = useMemo(() => {
    return strategies.map(s => {
      const linkedCaps = capabilities.filter(c => c.strategyIds?.includes(s.id));
      const capIds = new Set(linkedCaps.flatMap(c => {
        const childIds = capabilities.filter(cc => cc.parent === c.id).map(cc => cc.id);
        return [c.id, ...childIds];
      }));
      const linkedInits = initiatives.filter(i => i.capabilities.some(cid => capIds.has(cid)));
      return { s, linkedCaps, linkedInits };
    });
  }, [strategies, capabilities, initiatives]);

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-[36px] font-bold text-white mb-8">{t('presentation.strategiesTitle')}</h1>
      {strategies.length === 0 ? (
        <p className="text-[16px] text-white/40 italic">{t('common.none')}</p>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {strategyData.map(({ s, linkedCaps, linkedInits }) => (
            <div key={s.id} className="rounded-xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold text-white ${s.priority === 1 ? 'bg-red-500' : s.priority === 2 ? 'bg-amber-500' : 'bg-gray-500'}`}>
                  P{s.priority}
                </span>
                <span className="text-[9px] text-white/40 uppercase">{s.timeHorizon}</span>
              </div>
              <h3 className="text-[18px] font-bold text-white mb-1">{s.name}</h3>
              <p className="text-[12px] text-white/60 mb-4">{s.description}</p>
              <div className="flex gap-4 text-[11px] text-white/40">
                <span>{linkedCaps.length} kap.</span>
                <span>{linkedInits.length} akt.</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CapabilityMomentumSlide({ capabilities, initiatives }: { capabilities: Capability[]; initiatives: Initiative[] }) {
  const { t } = useTranslation();
  const l1 = capabilities.filter(c => c.level === 1);

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-[36px] font-bold text-white mb-8">{t('presentation.capMomentumTitle')}</h1>
      <div className="grid grid-cols-3 gap-4">
        {l1.map(cap => {
          const children = capabilities.filter(c => c.parent === cap.id);
          const allIds = new Set([cap.id, ...children.map(c => c.id)]);
          const linkedInits = initiatives.filter(i => i.capabilities.some(cid => allIds.has(cid)));
          const hasTarget = cap.maturityTarget && cap.maturityTarget !== cap.maturity;

          return (
            <div key={cap.id} className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-[16px] text-white font-semibold mb-2">{cap.name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
                  <span className="text-[11px] text-white/60">M: {cap.maturity}</span>
                </div>
                {hasTarget && (
                  <>
                    <span className="text-white/30">→</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturityTarget!] }} />
                      <span className="text-[11px] text-indigo-400 font-semibold">{cap.maturityTarget}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[cap.risk] }} />
                  <span className="text-[10px] text-white/40">R: {cap.risk}</span>
                </div>
              </div>
              <div className="text-[10px] text-white/30">{linkedInits.length} aktivitet(er)</div>
              {children.slice(0, 3).map(c => (
                <div key={c.id} className="text-[10px] text-white/30 py-0.5 pl-2 border-l border-white/10 mt-0.5">{c.name}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PortfolioSlide({ initiatives, capabilities }: { initiatives: Initiative[]; capabilities: Capability[] }) {
  const { t } = useTranslation();
  const capMap = useMemo(() => new Map(capabilities.map(c => [c.id, c])), [capabilities]);

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-[36px] font-bold text-white mb-8">{t('presentation.portfolioTitle')}</h1>
      <div className="space-y-3">
        {DIMENSIONS.map(dim => {
          const dimInits = initiatives.filter(i => i.dimension === dim.key).sort((a, b) => a.order - b.order);
          if (dimInits.length === 0) return null;
          return (
            <div key={dim.key}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dim.color }} />
                <span className="text-[14px] font-semibold text-white">{t(`labels.dimensions.${dim.key}`)}</span>
                <span className="text-[11px] text-white/30">{dimInits.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pl-5">
                {dimInits.map(i => (
                  <div key={i.id} className="px-3 py-2 rounded-lg border-l-[3px]" style={{ borderColor: dim.color, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="text-[12px] text-white font-medium">{i.name}</div>
                    <div className="text-[9px] text-white/40 mt-0.5">{i.horizon === 'near' ? t('labels.horizon.near') : t('labels.horizon.far')}</div>
                    {i.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {i.capabilities.slice(0, 2).map(cid => {
                          const cap = capMap.get(cid);
                          return cap ? (
                            <span key={cid} className="px-1 py-0.5 text-[8px] rounded bg-white/10 text-white/50">{cap.name}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BottlenecksSlide({ capabilities, initiatives }: { capabilities: Capability[]; initiatives: Initiative[] }) {
  const { t } = useTranslation();

  const bottlenecks = useMemo(() => {
    return capabilities
      .filter(c => c.level === 1)
      .map(cap => {
        const childIds = capabilities.filter(c => c.parent === cap.id).map(c => c.id);
        const allIds = new Set([cap.id, ...childIds]);
        const linkedCount = initiatives.filter(i => i.capabilities.some(cid => allIds.has(cid))).length;
        const flags: string[] = [];
        if (cap.risk === 3 && cap.maturity === 1) flags.push(t('dashboard.bottleneckHighRisk'));
        if (!cap.maturityTarget) flags.push(t('dashboard.bottleneckNoTarget'));
        if (linkedCount === 0) flags.push(t('dashboard.bottleneckNoInitiatives'));
        return { cap, linkedCount, flags };
      })
      .filter(b => b.flags.length > 0)
      .sort((a, b) => b.flags.length - a.flags.length);
  }, [capabilities, initiatives, t]);

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-[36px] font-bold text-white mb-8">{t('presentation.bottlenecksTitle')}</h1>
      {bottlenecks.length === 0 ? (
        <p className="text-[20px] text-green-400 font-semibold">✓ Ingen strategiske flaskehalser</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {bottlenecks.map(({ cap, linkedCount, flags }) => (
            <div key={cap.id} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
                <span className="text-[16px] font-semibold text-white">{cap.name}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/40 mb-3">
                <span>M: {cap.maturity}{cap.maturityTarget ? ` → ${cap.maturityTarget}` : ''}</span>
                <span>R: {cap.risk}</span>
                <span>{linkedCount} akt.</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {flags.map(f => (
                  <span key={f} className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-300 border border-red-500/30">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EffectSummarySlide({ effects, initiatives }: { effects: ReturnType<typeof useStore.getState>['effects']; initiatives: Initiative[] }) {
  const { t } = useTranslation();
  const linkedInitIds = new Set(effects.flatMap(e => e.initiatives));
  const linkedInits = initiatives.filter(i => linkedInitIds.has(i.id));

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-[36px] font-bold text-white mb-8">{t('presentation.slides.effects')}</h1>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-[14px] font-semibold text-white/60 mb-3 uppercase tracking-wide">{t('dashboard.activities')}</h2>
          <div className="space-y-1.5">
            {linkedInits.map(i => (
              <div key={i.id} className="px-3 py-2 rounded-lg text-[11px] text-white/70" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                {i.name}
              </div>
            ))}
            {linkedInits.length === 0 && <p className="text-[12px] text-white/30 italic">{t('common.none')}</p>}
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-white/60 mb-3 uppercase tracking-wide">{t('effects.title')}</h2>
          <div className="space-y-1.5">
            {effects.map(e => (
              <div key={e.id} className="px-3 py-2 rounded-lg text-[11px] text-white/70" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div className="text-[12px] text-white font-medium">{e.name}</div>
                {e.indicator && (
                  <div className="text-[9px] text-white/40 mt-0.5">{e.indicator}: {e.baseline} → {e.target}</div>
                )}
              </div>
            ))}
            {effects.length === 0 && <p className="text-[12px] text-white/30 italic">{t('common.none')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategicReadingSlide({ initiatives, capabilities, effects }: { initiatives: Initiative[]; capabilities: Capability[]; effects: Effect[] }) {
  const { t } = useTranslation();
  const narrative = useMemo(
    () => generateNarrative(initiatives, capabilities, effects),
    [initiatives, capabilities, effects]
  );

  // Split narrative into sentences for visual presentation
  const sentences = useMemo(() => {
    if (!narrative) return [];
    return narrative.split(/(?<=\.)\s+/).filter(s => s.trim().length > 0);
  }, [narrative]);

  // Key stats for visual context
  const near = initiatives.filter(i => i.horizon === 'near').length;
  const far = initiatives.filter(i => i.horizon === 'far').length;
  const confirmed = initiatives.filter(i => i.confidence === 'confirmed').length;
  const dimCount = new Set(initiatives.map(i => i.dimension)).size;

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-[36px] font-bold text-white mb-10">{t('presentation.strategicReadingTitle')}</h1>

      {/* Narrative text */}
      <div className="space-y-4 mb-12">
        {sentences.map((sentence, idx) => (
          <p
            key={idx}
            className="text-[20px] leading-relaxed text-white/90"
            style={{ textIndent: idx === 0 ? 0 : undefined }}
          >
            {sentence}
          </p>
        ))}
      </div>

      {/* Supporting stats bar */}
      <div className="flex gap-8 pt-6 border-t border-white/10">
        <div className="text-center">
          <div className="text-[28px] font-bold text-[#6366f1]">{initiatives.length}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wide">{t('dashboard.activities')}</div>
        </div>
        <div className="text-center">
          <div className="text-[28px] font-bold text-white/70">{near}/{far}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wide">{t('labels.horizon.near')}/{t('labels.horizon.far')}</div>
        </div>
        <div className="text-center">
          <div className="text-[28px] font-bold text-[#22c55e]">{capabilities.length}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wide">{t('detail.capabilities')}</div>
        </div>
        <div className="text-center">
          <div className="text-[28px] font-bold text-[#eab308]">{dimCount}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wide">{t('presentation.dimensions')}</div>
        </div>
        <div className="text-center">
          <div className="text-[28px] font-bold text-[#a78bfa]">{confirmed}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wide">{t('confidence.confirmed')}</div>
        </div>
      </div>
    </div>
  );
}

function SummarySlide({ initiatives, capabilities }: { initiatives: Initiative[]; capabilities: Capability[] }) {
  const { t } = useTranslation();
  const totalDeps = initiatives.reduce((acc, i) => acc + i.dependsOn.length, 0);
  const withTarget = capabilities.filter(c => c.maturityTarget).length;
  return (
    <div className="w-full max-w-4xl text-center">
      <h1 className="text-[42px] font-bold text-white mb-10">{t('presentation.summaryTitle')}</h1>
      <div className="grid grid-cols-4 gap-6 mb-10">
        <div>
          <div className="text-[48px] font-bold text-[#6366f1]">{initiatives.length}</div>
          <div className="text-[13px] text-white/50">{t('dashboard.activities')}</div>
        </div>
        <div>
          <div className="text-[48px] font-bold text-[#22c55e]">{capabilities.length}</div>
          <div className="text-[13px] text-white/50">{t('detail.capabilities')}</div>
        </div>
        <div>
          <div className="text-[48px] font-bold text-[#eab308]">{totalDeps}</div>
          <div className="text-[13px] text-white/50">{t('dashboard.dependencies')}</div>
        </div>
        <div>
          <div className="text-[48px] font-bold text-[#a78bfa]">{withTarget}</div>
          <div className="text-[13px] text-white/50">{t('forms.maturityTarget')}</div>
        </div>
      </div>
      <div className="flex justify-center gap-3">
        {DIMENSIONS.map(d => (
          <div key={d.key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[12px] text-white/60">{t(`labels.dimensions.${d.key}`)}: {initiatives.filter(i => i.dimension === d.key).length}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
