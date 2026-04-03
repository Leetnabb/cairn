import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { generateNarrative } from '../../lib/narrativeEngine';
import { StrategicNarrative } from '../ui/StrategicNarrative';
import { CairnMark } from '../CairnLogo';
import { DIMENSIONS, DIMENSION_MAP, MATURITY_COLORS, EFFECT_TYPE_COLORS } from '../../types';
import type { Initiative } from '../../types';

// ── helpers ────────────────────────────────────────────────────────────────

function statusDot(s?: Initiative['status']) {
  if (!s || s === 'planned' || s === 'active' || s === 'done') return null;
  if (s === 'idea')
    return <span className="ml-1 text-[8px] text-purple-400 border border-dashed border-purple-400 rounded px-1 italic">?</span>;
  return null;
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
      return prev && prev.status === 'idea' && i.status !== 'idea';
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
        lines.push(`"${i.name}" moved from idea to planned`);
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
      <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-3 font-medium font-body">
        {t('board.sinceLastMeeting')}
      </div>
      {!diff ? (
        <p className="text-[14px] text-text-secondary italic">{t('board.noSnapshot')}</p>
      ) : (
        <div className="space-y-1">
          <p className="text-[13px] text-text-secondary mb-2 font-body">
            Since {diff.date}:
          </p>
          {diff.lines.length === 0 ? (
            <p className="text-[14px] text-text-secondary italic">No significant changes since last snapshot.</p>
          ) : (
            <ul className="space-y-1">
              {diff.lines.map((line, i) => (
                <li key={i} className="text-[14px] text-text-secondary flex items-start gap-2 font-body">
                  <span className="text-accent mt-1 shrink-0">·</span>
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
      <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-4 font-medium font-body">
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
                  <span className="text-[15px] font-medium text-text-primary font-serif">
                    {cap.name}
                  </span>
                </div>
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-text-tertiary">{t('board.maturity')} {cap.maturity}/3</span>
              </div>
              <div className="pl-4 space-y-1.5">
                {near.map(i => (
                  <button
                    key={i.id}
                    onClick={() => onSelectInitiative(i.id)}
                    className="flex items-center gap-2 w-full text-left hover:bg-bg-hover/30 rounded px-2 py-1 transition-colors group"
                    style={{ opacity: i.status === 'idea' ? 0.7 : 1 }}
                  >
                    <span className="text-accent text-[11px]">→</span>
                    <span
                      className={`text-[14px] text-text-primary ${i.status === 'idea' ? 'italic' : ''} font-body`}
                      style={{ lineHeight: 1.7 }}
                    >
                      {i.name}
                      {statusDot(i.status)}
                    </span>
                    <span className="text-[10px] text-text-tertiary ml-auto shrink-0">{DIMENSION_MAP[i.dimension]?.label}</span>
                  </button>
                ))}
                {far.map(i => (
                  <button
                    key={i.id}
                    onClick={() => onSelectInitiative(i.id)}
                    className="flex items-center gap-2 w-full text-left hover:bg-bg-hover/30 rounded px-2 py-1 transition-colors"
                    style={{ opacity: i.status === 'idea' ? 0.4 : 0.65 }}
                  >
                    <span className="text-text-tertiary text-[10px] ml-4">→</span>
                    <span
                      className={`text-[13px] text-text-secondary ${i.status === 'idea' ? 'italic' : ''} font-body`}
                      style={{ lineHeight: 1.7 }}
                    >
                      {i.name}
                      {statusDot(i.status)}
                    </span>
                    <span className="text-[10px] text-text-tertiary ml-auto shrink-0">{DIMENSION_MAP[i.dimension]?.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {unlinked.length > 0 && (
          <div>
            <div className="text-[12px] text-text-tertiary mb-2 font-body">
              Unlinked to capability
            </div>
            <div className="pl-4 space-y-1.5">
              {unlinked.map(i => (
                <button key={i.id} onClick={() => onSelectInitiative(i.id)}
                  className="flex items-center gap-2 w-full text-left hover:bg-bg-hover/30 rounded px-2 py-1 transition-colors">
                  <span className="text-text-tertiary text-[11px]">→</span>
                  <span className="text-[14px] text-text-secondary font-body" style={{ lineHeight: 1.7 }}>
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

    // 1. Idea-stage initiatives blocking active ones
    const blockedByIdea = initiatives.filter(i =>
      i.status !== 'idea' &&
      i.dependsOn.some(depId => {
        const dep = initiatives.find(x => x.id === depId);
        return dep && dep.status === 'idea';
      })
    );
    if (blockedByIdea.length > 0) {
      const init = blockedByIdea[0];
      const blocker = initiatives.find(x => init.dependsOn.includes(x.id) && x.status === 'idea')!;
      items.push(`Should "${blocker.name}" move beyond the idea stage? It is a dependency for "${init.name}" and ${blockedByIdea.length > 1 ? `${blockedByIdea.length - 1} other ${blockedByIdea.length - 1 === 1 ? 'initiative' : 'initiatives'}` : 'other initiatives'}.`);
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
      <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-3 font-medium font-body">
        {t('board.decisionsRequired')}
      </div>
      {decisions.length === 0 ? (
        <p className="text-[14px] text-text-secondary italic">{t('board.noDecisions')}</p>
      ) : (
        <ol className="space-y-4">
          {decisions.map((d, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-accent text-[13px] font-bold shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-[15px] text-text-primary font-body" style={{ lineHeight: 1.7 }}>
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
        <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-4 font-medium">{t('board.effectsOverview')}</div>
        <p className="text-[14px] text-text-secondary italic">{t('board.noEffects')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-4 font-medium font-body">
        {t('board.effectsOverview')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {effects.map(eff => {
          const linkedInits = eff.initiatives.length;
          const linkedCaps = eff.capabilities.length;
          const hasAnyInit = linkedInits > 0;
          const anyIdea = eff.initiatives.some(id => {
            const init = initiatives.find(x => x.id === id);
            return init && init.status === 'idea';
          });
          const status = !hasAnyInit ? 'unsupported' : anyIdea ? 'atRisk' : 'onTrack';
          const statusColor = status === 'unsupported' ? '#94a3b8' : status === 'atRisk' ? '#f59e0b' : '#22c55e';
          const typeColor = EFFECT_TYPE_COLORS[eff.type] || '#6366f1';

          return (
            <div
              key={eff.id}
              className="rounded border border-border bg-bg-lane p-3 cursor-default hover:border-border-medium transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[15px] text-text-primary font-medium font-body">
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
                <span className="text-[10px] text-text-tertiary">{linkedInits} initiatives · {linkedCaps} capabilities</span>
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
      <div className="h-full bg-bg-lane border-l border-border flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[11px] uppercase text-text-secondary tracking-wider">Initiative</span>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary text-lg leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dim.color }} />
            <span className="text-[10px] text-text-secondary uppercase">{dim.label} · {t(`labels.horizon.${init.horizon}`)}</span>
          </div>
          <h2 className="text-[18px] text-text-primary font-medium font-serif">{init.name}</h2>
          {init.owner && (
            <div>
              <div className="text-[10px] text-text-tertiary uppercase mb-0.5">{t('common.owner')}</div>
              <div className="text-[13px] text-text-secondary">{init.owner}</div>
            </div>
          )}
          {init.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed">{init.description}</p>
          )}
          {linkedCaps.length > 0 && (
            <div>
              <div className="text-[10px] text-text-tertiary uppercase mb-1">Capabilities</div>
              <div className="space-y-1">
                {linkedCaps.map(c => (
                  <div key={c.id} className="text-[12px] text-text-secondary flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MATURITY_COLORS[c.maturity] }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          {linkedEffects.length > 0 && (
            <div>
              <div className="text-[10px] text-text-tertiary uppercase mb-1">Effects</div>
              <div className="space-y-1">
                {linkedEffects.map(e => (
                  <div key={e.id} className="text-[12px] text-text-secondary">{e.name}</div>
                ))}
              </div>
            </div>
          )}
          {dependsOn.length > 0 && (
            <div>
              <div className="text-[10px] text-text-tertiary uppercase mb-1">Depends on</div>
              <div className="space-y-1">
                {dependsOn.map(i => (
                  <div key={i.id} className="text-[12px] text-text-secondary">{i.name}</div>
                ))}
              </div>
            </div>
          )}
          {init.notes && (
            <div>
              <div className="text-[10px] text-text-tertiary uppercase mb-1">Notes</div>
              <p className="text-[12px] text-text-secondary leading-relaxed">{init.notes}</p>
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
    <div className="h-full bg-bg-lane border-l border-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[11px] uppercase text-text-secondary tracking-wider">Capability</span>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary text-lg leading-none">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h2 className="text-[18px] text-text-primary font-medium font-serif">{cap.name}</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card rounded p-2">
            <div className="text-[9px] text-text-tertiary uppercase mb-0.5">Maturity</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MATURITY_COLORS[cap.maturity] }} />
              <span className="text-[12px] text-text-secondary">{cap.maturity}/3</span>
              {cap.maturityTarget && (
                <span className="text-[11px] text-text-tertiary"> → {cap.maturityTarget}/3</span>
              )}
            </div>
          </div>
          <div className="bg-card rounded p-2">
            <div className="text-[9px] text-text-tertiary uppercase mb-0.5">Risk</div>
            <span className="text-[12px] text-text-secondary">{cap.risk}/3</span>
          </div>
        </div>
        {cap.description && (
          <p className="text-[13px] text-text-secondary leading-relaxed">{cap.description}</p>
        )}
        {linkedInits.length > 0 && (
          <div>
            <div className="text-[10px] text-text-tertiary uppercase mb-1">Linked initiatives</div>
            <div className="space-y-1">
              {linkedInits.map(i => (
                <div key={i.id} className="text-[12px] text-text-secondary flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DIMENSION_MAP[i.dimension]?.color }} />
                  {i.name}
                </div>
              ))}
            </div>
          </div>
        )}
        {linkedEffects.length > 0 && (
          <div>
            <div className="text-[10px] text-text-tertiary uppercase mb-1">Linked effects</div>
            <div className="space-y-1">
              {linkedEffects.map(e => (
                <div key={e.id} className="text-[12px] text-text-secondary">{e.name}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status Legend ──────────────────────────────────────────────────────

function StatusLegend() {
  const { t } = useTranslation();
  return (
    <div className="text-right">
      <div className="text-[10px] text-text-tertiary uppercase mb-1">{t('labels.status.label')}</div>
      <div className="flex items-center justify-end gap-3 text-[11px] text-text-secondary">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-accent" /> {t('labels.status.active')}</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gray-300" /> {t('labels.status.planned')}</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full border border-dashed border-purple-500 opacity-60" /> {t('labels.status.idea')}</span>
      </div>
    </div>
  );
}

// ── Main Board View ────────────────────────────────────────────────────────

export function BoardView({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const [boardSelectedItem, setBoardSelectedItem] = useState<{ type: 'capability' | 'initiative'; id: string } | null>(null);
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
    <div className="fixed inset-0 z-50 flex" data-mode="board" style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
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
        <header className="sticky top-0 z-10 flex items-center justify-between px-10 py-3 border-b board-no-print" style={{ background: 'var(--bg-header)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-3">
            <CairnMark size={0.4} />
            <span className="text-[14px] font-medium text-text-secondary font-body">
              {showScenario ? `${activeScenarioName} · ` : ''}{t('board.title')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-[11px] text-text-secondary border border-border rounded hover:border-border-medium hover:text-text-primary transition-colors"
            >
              {t('board.savePDF')}
            </button>
            <button
              onClick={() => onClose?.()}
              className="px-3 py-1.5 text-[11px] text-accent hover:text-primary-light transition-colors"
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
              <p className="text-[11px] text-text-tertiary">{showScenario ? `Scenario: ${activeScenarioName}` : ''}</p>
              <StatusLegend />
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
          <footer className="border-t pt-6" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-[12px] text-text-tertiary font-body">
              Cairn · cairnpath.io
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5 font-body">
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
