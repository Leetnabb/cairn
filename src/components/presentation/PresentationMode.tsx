import { useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSIONS, DIMENSION_MAP, MATURITY_COLORS, RISK_COLORS, EFFECT_TYPE_COLORS } from '../../types';
import type { Capability, Effect, EffectType, Initiative } from '../../types';
import { CairnLogo } from '../CairnLogo';

const SLIDES = ['overview', 'ledelse', 'virksomhet', 'organisasjon', 'teknologi', 'capabilities', 'effects', 'summary'] as const;

function useSlideLabels() {
  const { t } = useTranslation();
  return useMemo(() => [
    t('presentation.slides.overview'),
    t('labels.dimensions.ledelse'),
    t('labels.dimensions.virksomhet'),
    t('labels.dimensions.organisasjon'),
    t('labels.dimensions.teknologi'),
    t('presentation.slides.capabilities'),
    t('presentation.slides.effects'),
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
        {(currentSlide === 'ledelse' || currentSlide === 'virksomhet' || currentSlide === 'organisasjon' || currentSlide === 'teknologi') && (
          <DimensionSlide dimensionKey={currentSlide} initiatives={initiatives} capabilities={capabilities} />
        )}
        {currentSlide === 'capabilities' && <CapabilitiesSlide capabilities={capabilities} />}
        {currentSlide === 'effects' && <EffectChainSlide effects={effects} initiatives={initiatives} capabilities={capabilities} />}
        {currentSlide === 'summary' && <SummarySlide initiatives={initiatives} capabilities={capabilities} />}
      </div>

      {/* Slide label */}
      <div className="text-center pb-3">
        <span className="text-[11px] text-white/40">{SLIDE_LABELS[slide]} &middot; {slide + 1}/{SLIDES.length}</span>
      </div>
    </div>
  );
}

function OverviewSlide({ initiatives }: { initiatives: ReturnType<typeof useStore.getState>['scenarioStates'][string]['initiatives'] }) {
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

function DimensionSlide({ dimensionKey, initiatives, capabilities }: { dimensionKey: string; initiatives: Initiative[]; capabilities: Capability[] }) {
  const { t } = useTranslation();
  const dim = DIMENSION_MAP[dimensionKey as keyof typeof DIMENSION_MAP];
  const capabilityMap = useMemo(() => new Map(capabilities.map(c => [c.id, c])), [capabilities]);
  const near = initiatives.filter(i => i.dimension === dimensionKey && i.horizon === 'near').sort((a, b) => a.order - b.order);
  const far = initiatives.filter(i => i.dimension === dimensionKey && i.horizon === 'far').sort((a, b) => a.order - b.order);

  const renderCard = (init: Initiative) => (
    <div key={init.id} className="px-4 py-3 rounded-lg mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${dim.color}` }}>
      <div className="text-[16px] text-white font-semibold">{init.name}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{init.owner}</div>
      {init.description && <div className="text-[12px] text-white/60 mt-1">{init.description}</div>}
      {init.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {init.capabilities.map(cid => {
            const cap = capabilityMap.get(cid);
            return cap ? (
              <span key={cid} className="px-1.5 py-0.5 text-[9px] rounded bg-white/10 text-white/60">{cap.name}</span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dim.color }} />
        <h1 className="text-[36px] font-bold text-white">{t(`labels.dimensions.${dimensionKey}`)}</h1>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-[14px] font-semibold text-white/60 mb-3 uppercase tracking-wide">{t('labels.horizon.nearFull')}</h2>
          {near.map(renderCard)}
          {near.length === 0 && <p className="text-[12px] text-white/30 italic">{t('presentation.noActivities')}</p>}
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-white/60 mb-3 uppercase tracking-wide">{t('labels.horizon.farFull')}</h2>
          {far.map(renderCard)}
          {far.length === 0 && <p className="text-[12px] text-white/30 italic">{t('presentation.noActivities')}</p>}
        </div>
      </div>
    </div>
  );
}

function CapabilitiesSlide({ capabilities }: { capabilities: Capability[] }) {
  const { t } = useTranslation();
  const l1 = capabilities.filter(c => c.level === 1);
  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-[36px] font-bold text-white mb-8">{t('presentation.slides.capabilities')}</h1>
      <div className="grid grid-cols-3 gap-4">
        {l1.map(cap => {
          const children = capabilities.filter(c => c.parent === cap.id);
          return (
            <div key={cap.id} className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-[16px] text-white font-semibold mb-1">{cap.name}</h3>
              <div className="flex gap-2 mb-2">
                <span className="flex items-center gap-1 text-[10px] text-white/50">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
                  M: {t(`labels.maturity.${cap.maturity}`)}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-white/50">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLORS[cap.risk] }} />
                  R: {t(`labels.risk.${cap.risk}`)}
                </span>
              </div>
              {children.map(c => (
                <div key={c.id} className="text-[11px] text-white/40 py-0.5 pl-2 border-l border-white/10">
                  {c.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EffectChainSlide({ effects, initiatives, capabilities }: { effects: Effect[]; initiatives: Initiative[]; capabilities: Capability[] }) {
  const { t } = useTranslation();
  const types: EffectType[] = ['cost', 'quality', 'speed', 'compliance', 'strategic'];

  // Gather all initiative/capability IDs referenced by effects
  const initIds = new Set(effects.flatMap(e => e.initiatives));
  const capIds = new Set(effects.flatMap(e => e.capabilities));
  const linkedInits = initiatives.filter(i => initIds.has(i.id));
  const linkedCaps = capabilities.filter(c => capIds.has(c.id));

  return (
    <div className="w-full max-w-6xl">
      <h1 className="text-[36px] font-bold text-white mb-8">{t('presentation.slides.effects')}</h1>
      <div className="grid grid-cols-3 gap-6">
        {/* Column 1: Activities */}
        <div>
          <h2 className="text-[14px] font-semibold text-white/60 mb-3 uppercase tracking-wide">{t('dashboard.activities')}</h2>
          <div className="space-y-1.5">
            {linkedInits.map(i => (
              <div key={i.id} className="px-3 py-2 rounded-lg text-[11px] text-white/70" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                {i.name}
              </div>
            ))}
          </div>
        </div>
        {/* Column 2: Capabilities */}
        <div>
          <h2 className="text-[14px] font-semibold text-white/60 mb-3 uppercase tracking-wide">{t('detail.capabilities')}</h2>
          <div className="space-y-1.5">
            {linkedCaps.map(c => (
              <div key={c.id} className="px-3 py-2 rounded-lg text-[11px] text-white/70" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                {c.name}
              </div>
            ))}
          </div>
        </div>
        {/* Column 3: Effects grouped by type */}
        <div>
          <h2 className="text-[14px] font-semibold text-white/60 mb-3 uppercase tracking-wide">{t('effects.title')}</h2>
          <div className="space-y-2">
            {types.map(type => {
              const typeEffects = effects.filter(e => e.type === type);
              if (typeEffects.length === 0) return null;
              return (
                <div key={type}>
                  {typeEffects.map(e => (
                    <div key={e.id} className="px-3 py-2 rounded-lg mb-1.5 border-l-[3px]" style={{ borderColor: EFFECT_TYPE_COLORS[type as EffectType], backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 text-[8px] font-medium rounded text-white" style={{ backgroundColor: EFFECT_TYPE_COLORS[type as EffectType] }}>
                          {t(`effects.types.${type}`)}
                        </span>
                      </div>
                      <div className="text-[12px] text-white font-medium">{e.name}</div>
                      {e.indicator && (
                        <div className="text-[9px] text-white/40 mt-0.5">
                          {e.indicator}: {e.baseline} &rarr; {e.target}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummarySlide({ initiatives, capabilities }: { initiatives: Initiative[]; capabilities: Capability[] }) {
  const { t } = useTranslation();
  const totalDeps = initiatives.reduce((acc, i) => acc + i.dependsOn.length, 0);
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
          <div className="text-[48px] font-bold text-[#ef4444]">{DIMENSIONS.length}</div>
          <div className="text-[13px] text-white/50">{t('presentation.dimensions')}</div>
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
