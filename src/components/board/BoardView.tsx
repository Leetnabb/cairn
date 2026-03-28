import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { generateNarrative } from '../../lib/narrativeEngine';
import { StrategicNarrative } from '../ui/StrategicNarrative';
import { CairnMark } from '../CairnLogo';
import { DIMENSIONS, DIMENSION_MAP, MATURITY_COLORS, EFFECT_TYPE_COLORS } from '../../types';
import type { Initiative } from '../../types';

// ── helpers ────────────────────────────────────────────────────────────────

function confidenceDot(c?: Initiative['confidence']) {
  if (!c || c === 'confirmed') return null;
  if (c === 'tentative')
    return <span className="ml-1 text-[8px] text-yellow-400 border border-dashed border-yellow-400 rounded px-1">~</span>;
  return <span className="ml-1 text-[8px] text-gray-400 border border-dotted border-gray-400 rounded px-1 italic">?</span>;
}

// ── Section 2: Since Last Meeting ─────────────────────────────────────────

function SinceLastMeeting() {
  const { t } = useTranslation();
  const snapshots = useStore(s => s.snapshots);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);

  const diff = useMemo(() => {
    if (snapshots.length === 0) return null;
    const sorted = [...snapshots].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const latest = sorted[0];
    const prevInits = latest.data.scenarioStates?.[latest.data.activeScenario]?.initiatives ?? [];

    const prevMap = new Map(prevInits.map(i => [i.id, i]));
    const currMap = new Map(initiatives.map(i => [i.id, i]));

    const added = initiatives.filter(i => !prevMap.has(i.id));
    const removed = prevInits.filter(i => !currMap.has(i.id));
    const confirmed = initiatives.filter(i => {
      const prev = prevMap.get(i.id);
      return prev && prev.confidence !== 'confirmed' && i.confidence === 'confirmed';
    });
    const unlinkedEffects = latest.data.effects?.filter(e =>
      e.initiatives.length > 0 && e.initiatives.every(id => !currMap.has(id))
    ) ?? [];

    const lines: string[] = [];
    if (added.length > 0) {
      const byDim: Record<string, number> = {};
      for (const i of added) byDim[i.dimension] = (byDim[i.dimension] || 0) + 1;
      for (const [dim, count] of Object.entries(byDim)) {
        lines.push(`${count} new ${count === 1 ? 'initiative' : 'initiatives'} added in ${DIMENSION_MAP[dim as keyof typeof DIMENSION_MAP]?.label ?? dim}`);
      }
    }
    if (removed.length > 0) {
      lines.push(`${removed.length} ${removed.length === 1 ? 'initiative' : 'initiatives'} removed`);
    }
    if (confirmed.length > 0) {
      for (const i of confirmed.slice(0, 2)) {
        lines.push(`"${i.name}" moved from tentative to confirmed`);
      }
    }
    if (unlinkedEffects.length > 0) {
      for (const e of unlinkedEffects.slice(0, 2)) {
        lines.push(`"${e.name}" is now unsupported — the initiative linked to it was removed`);
      }
    }

    const date = new Date(latest.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    return { date, lines };
  }, [snapshots, initiatives]);

  return (
    <div className="border-l-[3px] pl-4 py-3" style={{ borderLeftColor: '#6366f1' }}>
      <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] mb-3 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {t('board.sinceLastMeeting')}
      </div>
      {!diff ? (
        <p className="text-[14px] text-[#94a3b8] italic">{t('board.noSnapshot')}</p>
      ) : (
        <div className="space-y-1">
          <p className="text-[13px] text-[#94a3b8] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            Since {diff.date}:
          </p>
          {diff.lines.length === 0 ? (
            <p className="text-[14px] text-[#94a3b8] italic">No significant changes since last snapshot.</p>
          ) : (
            <ul className="space-y-1">
              {diff.lines.map((line, i) => (
                <li key={i} className="text-[14px] text-[#cbd5e1] flex items-start gap-2" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                  <span className="text-[#6366f1] mt-1 shrink-0">·</span>
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section 3: Strategy Path ───────────────────────────────────────────────

function StrategyPath({ onSelectInitiative, onSelectCapability }: {
  onSelectInitiative: (id: string) => void;
  onSelectCapability: (id: string) => void;
}) {
  const { t } = useTranslation();
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);

  const l1Caps = capabilities.filter(c => c.level === 1);
  const unlinked = initiatives.filter(i => i.capabilities.length === 0);

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] mb-4 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {t('board.strategyPath')}
      </div>
      <div className="space-y-6">
        {l1Caps.map(cap => {
          const children = capabilities.filter(c => c.parent === cap.id);
          const allCapIds = [cap.id, ...children.map(c => c.id)];
          const linked = initiatives.filter(i => i.capabilities.some(cid => allCapIds.includes(cid)));
          if (linked.length === 0) return null;

          const near = linked.filter(i => i.horizon === 'near');
          const far = linked.filter(i => i.horizon === 'far');

          return (
            <div key={cap.id}>
              <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => onSelectCapability(cap.id)}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
                  <span className="text-[15px] font-medium text-[#f1f5f9]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    {cap.name}
                  </span>
                </div>
                <div className="h-px flex-1 bg-[#1e2a3a]" />
                <span className="text-[10px] text-[#4b5563]">{t('board.maturity')} {cap.maturity}/3</span>
              </div>
              <div className="pl-4 space-y-1.5">
                {near.map(i => (
                  <button
                    key={i.id}
                    onClick={() => onSelectInitiative(i.id)}
                    className="flex items-center gap-2 w-full text-left hover:bg-[#1a2744]/30 rounded px-2 py-1 transition-colors group"
                    style={{ opacity: i.confidence === 'under_consideration' ? 0.6 : i.confidence === 'tentative' ? 0.85 : 1 }}
                  >
                    <span className="text-[#6366f1] text-[11px]">→</span>
                    <span
                      className={`text-[14px] text-[#e2e8f0] ${i.confidence === 'under_consideration' ? 'italic' : ''}`}
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", lineHeight: 1.7 }}
                    >
                      {i.name}
                      {confidenceDot(i.confidence)}
                    </span>
                    <span className="text-[10px] text-[#4b5563] ml-auto shrink-0">{DIMENSION_MAP[i.dimension]?.label}</span>
                  </button>
                ))}
                {far.map(i => (
                  <button
                    key={i.id}
                    onClick={() => onSelectInitiative(i.id)}
                    className="flex items-center gap-2 w-full text-left hover:bg-[#1a2744]/30 rounded px-2 py-1 transition-colors"
                    style={{ opacity: i.confidence === 'under_consideration' ? 0.4 : i.confidence === 'tentative' ? 0.55 : 0.65 }}
                  >
                    <span className="text-[#4b5563] text-[10px] ml-4">→</span>
                    <span
                      className={`text-[13px] text-[#94a3b8] ${i.confidence === 'under_consideration' ? 'italic' : ''}`}
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", lineHeight: 1.7 }}
                    >
                      {i.name}
                      {confidenceDot(i.confidence)}
                    </span>
                    <span className="text-[10px] text-[#374151] ml-auto shrink-0">{DIMENSION_MAP[i.dimension]?.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {unlinked.length > 0 && (
          <div>
            <div className="text-[12px] text-[#4b5563] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Unlinked to capability
            </div>
            <div className="pl-4 space-y-1.5">
              {unlinked.map(i => (
                <button key={i.id} onClick={() => onSelectInitiative(i.id)}
                  className="flex items-center gap-2 w-full text-left hover:bg-[#1a2744]/30 rounded px-2 py-1 transition-colors">
                  <span className="text-[#4b5563] text-[11px]">→</span>
                  <span className="text-[14px] text-[#94a3b8]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", lineHeight: 1.7 }}>
                    {i.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 4: Decisions Required ─────────────────────────────────────────

function DecisionsRequired() {
  const { t } = useTranslation();
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);

  const decisions = useMemo(() => {
    const items: string[] = [];

    // 1. Unconfirmed blocking confirmed
    const confirmedDeps = initiatives.filter(i =>
      (i.confidence ?? 'confirmed') === 'confirmed' &&
      i.dependsOn.some(depId => {
        const dep = initiatives.find(x => x.id === depId);
        return dep && dep.confidence && dep.confidence !== 'confirmed';
      })
    );
    if (confirmedDeps.length > 0) {
      const init = confirmedDeps[0];
      const blocker = initiatives.find(x => init.dependsOn.includes(x.id) && x.confidence !== 'confirmed')!;
      items.push(`Should "${blocker.name}" be confirmed before proceeding? It is currently ${blocker.confidence === 'tentative' ? 'tentative' : 'under consideration'} but is a dependency for "${init.name}" and ${confirmedDeps.length > 1 ? `${confirmedDeps.length - 1} other confirmed ${confirmedDeps.length - 1 === 1 ? 'initiative' : 'initiatives'}` : 'other confirmed initiatives'}.`);
    }

    // 2. Low-maturity caps with no initiatives
    const referenced = new Set(initiatives.flatMap(i => i.capabilities));
    const lowUnlinked = capabilities.filter(c => c.maturity === 1 && !referenced.has(c.id));
    if (lowUnlinked.length > 0) {
      const names = lowUnlinked.slice(0, 2).map(c => `"${c.name}"`).join(' and ');
      items.push(`${names} ${lowUnlinked.length > 1 ? 'have' : 'has'} low maturity and no supporting initiatives. Should an initiative be planned, or should the maturity target be revised?`);
    }

    // 3. Effects without initiatives
    const unlinkedEffects = effects.filter(e => e.initiatives.length === 0);
    if (unlinkedEffects.length > 0) {
      const e = unlinkedEffects[0];
      items.push(`The effect "${e.name}" has no supporting initiatives. Should a new initiative be added, or should the effect be removed from the strategy?`);
    }

    // 4. Dimension imbalance
    const counts: Record<string, number> = {};
    for (const d of DIMENSIONS) counts[d.key] = 0;
    for (const i of initiatives) counts[i.dimension] = (counts[i.dimension] || 0) + 1;
    const total = initiatives.length;
    const domDim = DIMENSIONS.reduce((a, b) => counts[a.key] > counts[b.key] ? a : b);
    const minDim = DIMENSIONS.reduce((a, b) => counts[a.key] < counts[b.key] ? a : b);
    if (total > 0 && counts[domDim.key] / total > 0.4 && counts[minDim.key] < 3) {
      items.push(`Should ${minDim.label} dimension investment increase? It currently has ${counts[minDim.key]} ${counts[minDim.key] === 1 ? 'initiative' : 'initiatives'} vs. ${domDim.label}'s ${counts[domDim.key]}. This imbalance may delay capability realisation.`);
    }

    // 5. Owner overload
    const ownerCount: Record<string, number> = {};
    for (const i of initiatives.filter(x => x.horizon === 'near')) {
      if (i.owner) ownerCount[i.owner] = (ownerCount[i.owner] || 0) + 1;
    }
    const overloaded = Object.entries(ownerCount).filter(([, n]) => n >= 4);
    if (overloaded.length > 0) {
      const [owner, count] = overloaded[0];
      items.push(`${owner} is responsible for ${count} near-horizon initiatives. Should ownership be redistributed to reduce execution risk?`);
    }

    return items.slice(0, 3);
  }, [initiatives, capabilities, effects]);

  return (
    <div className="border-l-[3px] pl-4 py-3" style={{ borderLeftColor: '#6366f1' }}>
      <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] mb-3 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {t('board.decisionsRequired')}
      </div>
      {decisions.length === 0 ? (
        <p className="text-[14px] text-[#94a3b8] italic">{t('board.noDecisions')}</p>
      ) : (
        <ol className="space-y-4">
          {decisions.map((d, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-[#6366f1] text-[13px] font-bold shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-[15px] text-[#e2e8f0]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", lineHeight: 1.7 }}>
                {d}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Section 5: Effects Overview ───────────────────────────────────────────

function EffectsOverview({ onSelect: _onSelect }: { onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  const effects = useStore(s => s.effects);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);

  if (effects.length === 0) {
    return (
      <div>
        <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] mb-4 font-medium">{t('board.effectsOverview')}</div>
        <p className="text-[14px] text-[#94a3b8] italic">{t('board.noEffects')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] mb-4 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {t('board.effectsOverview')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {effects.map(eff => {
          const linkedInits = eff.initiatives.length;
          const linkedCaps = eff.capabilities.length;
          const hasAnyInit = linkedInits > 0;
          const anyTentative = eff.initiatives.some(id => {
            const init = initiatives.find(x => x.id === id);
            return init && (init.confidence === 'tentative' || init.confidence === 'under_consideration');
          });
          const status = !hasAnyInit ? 'unsupported' : anyTentative ? 'atRisk' : 'onTrack';
          const statusColor = status === 'unsupported' ? '#94a3b8' : status === 'atRisk' ? '#f59e0b' : '#22c55e';
          const typeColor = EFFECT_TYPE_COLORS[eff.type] || '#6366f1';

          return (
            <div
              key={eff.id}
              className="rounded border border-[#1e2a3a] bg-[#0d1520] p-3 cursor-default hover:border-[#2d3748] transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[15px] text-[#f1f5f9] font-medium" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                  {eff.name}
                </span>
                <span className="text-[9px] font-semibold shrink-0 mt-0.5" style={{ color: statusColor }}>
                  {t(`board.${status === 'onTrack' ? 'onTrack' : status === 'atRisk' ? 'atRisk' : 'unsupported'}`)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: typeColor + '22', color: typeColor }}>
                  {eff.type}
                </span>
                <span className="text-[10px] text-[#4b5563]">{linkedInits} initiatives · {linkedCaps} capabilities</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section 6: Read-only Detail Panel ─────────────────────────────────────

function ReadOnlyDetailPanel({
  item,
  onClose,
}: {
  item: { type: 'initiative' | 'capability'; id: string };
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);

  if (item.type === 'initiative') {
    const init = initiatives.find(i => i.id === item.id);
    if (!init) return null;
    const dim = DIMENSION_MAP[init.dimension];
    const linkedCaps = capabilities.filter(c => init.capabilities.includes(c.id));
    const linkedEffects = effects.filter(e => e.initiatives.includes(init.id));
    const dependsOn = initiatives.filter(i => init.dependsOn.includes(i.id));

    return (
      <div className="h-full bg-[#0d1520] border-l border-[#1e2a3a] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a3a]">
          <span className="text-[11px] uppercase text-[#94a3b8] tracking-wider">Initiative</span>
          <button onClick={onClose} className="text-[#4b5563] hover:text-[#94a3b8] text-lg leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dim.color }} />
            <span className="text-[10px] text-[#94a3b8] uppercase">{dim.label} · {t(`labels.horizon.${init.horizon}`)}</span>
          </div>
          <h2 className="text-[18px] text-[#f1f5f9] font-medium" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{init.name}</h2>
          {init.confidence && init.confidence !== 'confirmed' && (
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${
              init.confidence === 'tentative'
                ? 'border-dashed border-yellow-500 text-yellow-400'
                : 'border-dotted border-gray-500 text-gray-400 italic'
            }`}>
              {t(`confidence.${init.confidence}`)}
            </span>
          )}
          {init.owner && (
            <div>
              <div className="text-[10px] text-[#4b5563] uppercase mb-0.5">{t('common.owner')}</div>
              <div className="text-[13px] text-[#cbd5e1]">{init.owner}</div>
            </div>
          )}
          {init.description && (
            <p className="text-[13px] text-[#94a3b8] leading-relaxed">{init.description}</p>
          )}
          {linkedCaps.length > 0 && (
            <div>
              <div className="text-[10px] text-[#4b5563] uppercase mb-1">Capabilities</div>
              <div className="space-y-1">
                {linkedCaps.map(c => (
                  <div key={c.id} className="text-[12px] text-[#94a3b8] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MATURITY_COLORS[c.maturity] }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          {linkedEffects.length > 0 && (
            <div>
              <div className="text-[10px] text-[#4b5563] uppercase mb-1">Effects</div>
              <div className="space-y-1">
                {linkedEffects.map(e => (
                  <div key={e.id} className="text-[12px] text-[#94a3b8]">{e.name}</div>
                ))}
              </div>
            </div>
          )}
          {dependsOn.length > 0 && (
            <div>
              <div className="text-[10px] text-[#4b5563] uppercase mb-1">Depends on</div>
              <div className="space-y-1">
                {dependsOn.map(i => (
                  <div key={i.id} className="text-[12px] text-[#94a3b8]">{i.name}</div>
                ))}
              </div>
            </div>
          )}
          {init.notes && (
            <div>
              <div className="text-[10px] text-[#4b5563] uppercase mb-1">Notes</div>
              <p className="text-[12px] text-[#94a3b8] leading-relaxed">{init.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Capability detail
  const cap = capabilities.find(c => c.id === item.id);
  if (!cap) return null;
  const linkedInits = initiatives.filter(i => i.capabilities.includes(cap.id));
  const linkedEffects = effects.filter(e => e.capabilities.includes(cap.id));

  return (
    <div className="h-full bg-[#0d1520] border-l border-[#1e2a3a] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a3a]">
        <span className="text-[11px] uppercase text-[#94a3b8] tracking-wider">Capability</span>
        <button onClick={onClose} className="text-[#4b5563] hover:text-[#94a3b8] text-lg leading-none">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h2 className="text-[18px] text-[#f1f5f9] font-medium" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{cap.name}</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#111827] rounded p-2">
            <div className="text-[9px] text-[#4b5563] uppercase mb-0.5">Maturity</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
              <span className="text-[12px] text-[#cbd5e1]">{cap.maturity}/3</span>
              {cap.maturityTarget && (
                <span className="text-[11px] text-[#4b5563]"> → {cap.maturityTarget}/3</span>
              )}
            </div>
          </div>
          <div className="bg-[#111827] rounded p-2">
            <div className="text-[9px] text-[#4b5563] uppercase mb-0.5">Risk</div>
            <span className="text-[12px] text-[#cbd5e1]">{cap.risk}/3</span>
          </div>
        </div>
        {cap.description && (
          <p className="text-[13px] text-[#94a3b8] leading-relaxed">{cap.description}</p>
        )}
        {linkedInits.length > 0 && (
          <div>
            <div className="text-[10px] text-[#4b5563] uppercase mb-1">Linked initiatives</div>
            <div className="space-y-1">
              {linkedInits.map(i => (
                <div key={i.id} className="text-[12px] text-[#94a3b8] flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DIMENSION_MAP[i.dimension]?.color }} />
                  {i.name}
                  {i.confidence && i.confidence !== 'confirmed' && (
                    <span className="text-[9px] text-[#4b5563]">({i.confidence.replace('_', ' ')})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {linkedEffects.length > 0 && (
          <div>
            <div className="text-[10px] text-[#4b5563] uppercase mb-1">Linked effects</div>
            <div className="space-y-1">
              {linkedEffects.map(e => (
                <div key={e.id} className="text-[12px] text-[#94a3b8]">{e.name}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confidence Legend ──────────────────────────────────────────────────────

function ConfidenceLegend() {
  const { t } = useTranslation();
  return (
    <div className="text-right">
      <div className="text-[10px] text-[#4b5563] uppercase mb-1">{t('board.confidenceLegend')}</div>
      <div className="flex items-center justify-end gap-3 text-[11px] text-[#94a3b8]">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#6366f1]" /> {t('confidence.confirmed')}</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full border border-dashed border-yellow-500 opacity-80" /> {t('confidence.tentative')}</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full border border-dotted border-gray-500 opacity-60" /> {t('confidence.under_consideration')}</span>
      </div>
    </div>
  );
}

// ── Main Board View ────────────────────────────────────────────────────────

export function BoardView() {
  const { t } = useTranslation();
  const setBoardViewMode = useStore(s => s.setBoardViewMode);
  const boardSelectedItem = useStore(s => s.ui.boardSelectedItem);
  const setBoardSelectedItem = useStore(s => s.setBoardSelectedItem);
  const scenarios = useStore(s => s.scenarios);
  const activeScenario = useStore(s => s.activeScenario);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);
  const strategicFrame = useStore(s => s.strategicFrame);

  const activeScenarioName = scenarios.find(s => s.id === activeScenario)?.name;
  const defaultScenarioName = scenarios[0]?.name;
  const showScenario = activeScenarioName && activeScenarioName !== defaultScenarioName;

  const narrative = useMemo(
    () => generateNarrative(initiatives, capabilities, effects, undefined, strategicFrame),
    [initiatives, capabilities, effects, strategicFrame]
  );

  const now = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: '#0a0f1a', color: '#f1f5f9' }}>
      {/* Board Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .board-print-area, .board-print-area * { visibility: visible; }
          .board-print-area { position: fixed; top: 0; left: 0; width: 100%; background: white !important; color: #1e293b !important; }
          .board-no-print { display: none !important; }
          .board-print-area h2, .board-print-area p, .board-print-area li { color: #1e293b !important; }
          .board-print-area [style*="color: #"] { color: #1e293b !important; }
        }
      `}</style>

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-10 py-3 border-b board-no-print" style={{ background: '#0a0f1a', borderColor: '#1e2a3a' }}>
          <div className="flex items-center gap-3">
            <CairnMark size={0.4} />
            <span className="text-[14px] font-medium text-[#94a3b8]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              {showScenario ? `${activeScenarioName} · ` : ''}{t('board.title')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-[11px] text-[#94a3b8] border border-[#1e2a3a] rounded hover:border-[#2d3748] hover:text-[#f1f5f9] transition-colors"
            >
              {t('board.savePDF')}
            </button>
            <button
              onClick={() => setBoardViewMode(false)}
              className="px-3 py-1.5 text-[11px] text-[#6366f1] hover:text-[#818cf8] transition-colors"
            >
              {t('board.exit')}
            </button>
          </div>
        </header>

        {/* Printable content */}
        <div className="board-print-area px-10 md:px-20 py-12 max-w-4xl mx-auto space-y-12">

          {/* Section 1: Strategic Reading */}
          <section>
            <StrategicNarrative narrative={narrative} isEditable dark />
            <div className="mt-3 flex items-start justify-between">
              <p className="text-[11px] text-[#4b5563]">{showScenario ? `Scenario: ${activeScenarioName}` : ''}</p>
              <ConfidenceLegend />
            </div>
          </section>

          {/* Section 2: Since Last Meeting */}
          <section>
            <SinceLastMeeting />
          </section>

          {/* Section 3: Strategy Path */}
          <section>
            <StrategyPath
              onSelectInitiative={(id) => setBoardSelectedItem({ type: 'initiative', id })}
              onSelectCapability={(id) => setBoardSelectedItem({ type: 'capability', id })}
            />
          </section>

          {/* Section 4: Decisions Required */}
          <section>
            <DecisionsRequired />
          </section>

          {/* Section 5: Effects Overview */}
          <section>
            <EffectsOverview onSelect={(id) => setBoardSelectedItem({ type: 'initiative', id })} />
          </section>

          {/* Section 7: Footer */}
          <footer className="border-t pt-6" style={{ borderColor: '#1e2a3a' }}>
            <p className="text-[12px] text-[#4b5563]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Cairn · cairnpath.io
            </p>
            <p className="text-[11px] text-[#374151] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              {t('board.dataAsOf')} {now}
            </p>
          </footer>
        </div>
      </div>

      {/* Section 6: Read-only detail panel */}
      {boardSelectedItem && (
        <div className="w-[380px] shrink-0 overflow-hidden animate-slide-in-right">
          <ReadOnlyDetailPanel
            item={boardSelectedItem}
            onClose={() => setBoardSelectedItem(null)}
          />
        </div>
      )}
    </div>
  );
}
