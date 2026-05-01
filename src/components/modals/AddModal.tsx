import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSIONS } from '../../types';
import type { DimensionKey, InitiativeStatus, EffectType, Horizon } from '../../types';
import { Button } from '../ui/Button';
import { ColorPalette } from '../ui/ColorPalette';
import AIFormAssist from '../ai/AIFormAssist';
import { AutoLinkButton } from '../ai/AutoLinkButton';

export function AddModal() {
  const { t } = useTranslation();
  const tab = useStore(s => s.ui.addModalTab);
  const defaults = useStore(s => s.ui.addModalDefaults);
  const setAddModalOpen = useStore(s => s.setAddModalOpen);
  const modules = useStore(s => s.modules);
  const addInitiative = useStore(s => s.addInitiative);
  const addCapability = useStore(s => s.addCapability);
  const addMilestone = useStore(s => s.addMilestone);
  const addValueChain = useStore(s => s.addValueChain);
  const addEffect = useStore(s => s.addEffect);
  const addGoal = useStore(s => s.addGoal);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const valueChains = useStore(s => s.valueChains);

  const [activeTab, setActiveTab] = useState<'initiative' | 'capability' | 'milestone' | 'valuechain' | 'effect' | 'goal'>(tab);
  const [confirmMsg, setConfirmMsg] = useState(false);

  // Initiative state
  const [iName, setIName] = useState('');
  const [iDesc, setIDesc] = useState('');
  const [iDim, setIDim] = useState<DimensionKey>(defaults?.dimension ?? 'ledelse');
  const [iHorizon, setIHorizon] = useState<Horizon>(defaults?.horizon ?? 'near');
  const [iOwner, setIOwner] = useState('');
  const [iCaps, setICaps] = useState<string[]>([]);
  const [iDeps, setIDeps] = useState<string[]>([]);
  const [iVCs, setIVCs] = useState<string[]>([]);
  const [iNotes, setINotes] = useState('');
  const [iStatus, setIStatus] = useState<InitiativeStatus>('planned');
  const [iCriticalPathOverride, setICriticalPathOverride] = useState<boolean | null>(null);

  // Inline value chain creation
  const [showInlineVC, setShowInlineVC] = useState(false);
  const [inlineVCName, setInlineVCName] = useState('');
  const [inlineVCColor, setInlineVCColor] = useState('#ec4899');

  // Capability state
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cLevel, setCLevel] = useState<1 | 2>(1);
  const [cParent, setCParent] = useState('');
  const [cMat, setCMat] = useState<1 | 2 | 3>(1);
  const [cMatTarget, setCMatTarget] = useState<1 | 2 | 3>(2);
  const [cRisk, setCRisk] = useState<1 | 2 | 3>(2);

  // Milestone state
  const [mName, setMName] = useState('');
  const [mHorizon, setMHorizon] = useState<Horizon>('near');
  const [mPosition, setMPosition] = useState(0.5);
  const [mColor, setMColor] = useState('#6366f1');

  // Value chain state
  const [vcName, setVCName] = useState('');
  const [vcColor, setVCColor] = useState('#ec4899');

  // Effect state
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eType, setEType] = useState<EffectType>('strategic');
  const [eIndicator, setEIndicator] = useState('');
  const [eBaseline, setEBaseline] = useState('');
  const [eTarget, setETarget] = useState('');
  const [eCaps, setECaps] = useState<string[]>([]);
  const [eInits, setEInits] = useState<string[]>([]);

  // Goal state
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');

  // Capability search
  const [capSearch, setCapSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAddModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setAddModalOpen]);

  const l1Caps = capabilities.filter(c => c.level === 1);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const showConfirmation = useCallback(() => {
    setConfirmMsg(true);
    setTimeout(() => setConfirmMsg(false), 1500);
  }, []);

  const resetInitiativeFields = () => {
    setIName(''); setIDesc(''); setICaps([]); setIDeps([]); setIVCs([]); setINotes(''); setIStatus('planned'); setICriticalPathOverride(null);
  };
  const resetCapabilityFields = () => { setCName(''); setCDesc(''); };
  const resetMilestoneFields = () => { setMName(''); };
  const resetValueChainFields = () => { setVCName(''); };
  const resetEffectFields = () => { setEName(''); setEDesc(''); setEType('strategic'); setEIndicator(''); setEBaseline(''); setETarget(''); setECaps([]); setEInits([]); };
  const resetGoalFields = () => { setGName(''); setGDesc(''); };

  const handleAddInitiative = (keepOpen: boolean) => {
    if (!iName.trim()) return;
    const maxOrder = Math.max(0, ...initiatives.filter(i => i.dimension === iDim && i.horizon === iHorizon).map(i => i.order));
    addInitiative({
      id: `i_${Date.now()}`, name: iName.trim(), description: iDesc.trim(), dimension: iDim, horizon: iHorizon,
      order: maxOrder + 1, owner: iOwner.trim(), capabilities: iCaps, dependsOn: iDeps, maturityEffect: {},
      notes: iNotes.trim(), valueChains: iVCs, status: iStatus, criticalPathOverride: iCriticalPathOverride,
    });
    if (keepOpen) { resetInitiativeFields(); showConfirmation(); } else { showConfirmation(); setTimeout(() => setAddModalOpen(false), 600); }
  };

  const handleAddCapability = (keepOpen: boolean) => {
    if (!cName.trim()) return;
    addCapability({
      id: `c_${Date.now()}`, name: cName.trim(), description: cDesc.trim(), level: cLevel,
      parent: cLevel === 2 ? (cParent || null) : null, maturity: cMat, maturityTarget: cMatTarget, risk: cRisk,
    });
    if (keepOpen) { resetCapabilityFields(); showConfirmation(); } else { showConfirmation(); setTimeout(() => setAddModalOpen(false), 600); }
  };

  const handleAddMilestone = (keepOpen: boolean) => {
    if (!mName.trim()) return;
    addMilestone({ id: `m_${Date.now()}`, name: mName.trim(), horizon: mHorizon, position: mPosition, color: mColor });
    if (keepOpen) { resetMilestoneFields(); showConfirmation(); } else { showConfirmation(); setTimeout(() => setAddModalOpen(false), 600); }
  };

  const handleAddValueChain = (keepOpen: boolean) => {
    if (!vcName.trim()) return;
    addValueChain({ id: `vc_${Date.now()}`, name: vcName.trim(), color: vcColor });
    if (keepOpen) { resetValueChainFields(); showConfirmation(); } else { showConfirmation(); setTimeout(() => setAddModalOpen(false), 600); }
  };

  const handleAddEffect = (keepOpen: boolean) => {
    if (!eName.trim()) return;
    addEffect({
      id: `eff_${Date.now()}`, name: eName.trim(), description: eDesc.trim(), type: eType,
      capabilities: eCaps, initiatives: eInits,
      indicator: eIndicator.trim() || undefined,
      baseline: eBaseline.trim() || undefined,
      target: eTarget.trim() || undefined,
    });
    if (keepOpen) { resetEffectFields(); showConfirmation(); } else { showConfirmation(); setTimeout(() => setAddModalOpen(false), 600); }
  };

  const handleAddGoal = (keepOpen: boolean) => {
    if (!gName.trim()) return;
    addGoal({
      id: `goal_${Date.now()}`,
      name: gName.trim(),
      description: gDesc.trim(),
      themeIds: [],
    });
    if (keepOpen) { resetGoalFields(); showConfirmation(); } else { showConfirmation(); setTimeout(() => setAddModalOpen(false), 600); }
  };

  const handleInlineVCCreate = () => {
    if (!inlineVCName.trim()) return;
    const id = `vc_${Date.now()}`;
    addValueChain({ id, name: inlineVCName.trim(), color: inlineVCColor });
    setIVCs(prev => [...prev, id]);
    setInlineVCName(''); setInlineVCColor('#ec4899'); setShowInlineVC(false);
  };

  const tabLabels: Record<string, string> = {
    initiative: t('addModal.initiative'),
    capability: t('addModal.capability'),
    milestone: t('addModal.milestone'),
    valuechain: t('addModal.valuechain'),
    effect: t('addModal.effect'),
    goal: t('addModal.goal'),
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setAddModalOpen(false)}>
      <div className="relative bg-card rounded-lg shadow-lg w-[440px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {confirmMsg && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-md z-10 animate-fade-in">
            &#10003; {t('common.created')}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['initiative', 'capability', 'milestone', 'valuechain', 'effect', 'goal'] as const).filter(tb => {
            if (tb === 'capability') return modules.capabilities;
            if (tb === 'effect') return modules.effects;
            return true;
          }).map(tb => (
            <button
              key={tb}
              onClick={() => setActiveTab(tb)}
              className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors ${
                activeTab === tb ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:bg-[var(--bg-hover)]'
              }`}
            >
              {tabLabels[tb]}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-44px)]">
          {activeTab === 'initiative' && (
            <div className="space-y-2">
              <AIFormAssist tabType="initiative" onSuggestion={(data) => {
                if (data.name) setIName(data.name as string);
                if (data.description) setIDesc(data.description as string);
                if (data.dimension) setIDim(data.dimension as DimensionKey);
                if (data.horizon) setIHorizon(data.horizon as Horizon);
                if (data.owner) setIOwner(data.owner as string);
                if (data.notes) setINotes(data.notes as string);
                if (Array.isArray(data.suggestedCapabilities)) {
                  const ids = (data.suggestedCapabilities as string[])
                    .map(name => capabilities.find(c => c.name.toLowerCase() === name.toLowerCase())?.id)
                    .filter((id): id is string => !!id);
                  if (ids.length > 0) setICaps(ids);
                }
              }} />
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.nameRequired')}</label>
                <input value={iName} onChange={e => setIName(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('common.description')}</label>
                <textarea value={iDesc} onChange={e => setIDesc(e.target.value)} rows={2}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('forms.dimension')}</label>
                  <select value={iDim} onChange={e => setIDim(e.target.value as DimensionKey)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded">
                    {DIMENSIONS.map(d => <option key={d.key} value={d.key}>{t(`labels.dimensions.${d.key}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('labels.horizon.label')}</label>
                  <select value={iHorizon} onChange={e => setIHorizon(e.target.value as Horizon)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded">
                    <option value="near">{t('labels.horizon.near')}</option>
                    <option value="far">{t('labels.horizon.far')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('common.owner')}</label>
                  <input value={iOwner} onChange={e => setIOwner(e.target.value)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.notes')}</label>
                <textarea value={iNotes} onChange={e => setINotes(e.target.value)} rows={2}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('labels.status.label')}</label>
                <div className="flex mt-0.5 border border-border rounded overflow-hidden">
                  {([
                    { value: 'idea' as const, label: t('labels.status.idea') },
                    { value: 'planned' as const, label: t('labels.status.planned') },
                    { value: 'active' as const, label: t('labels.status.active') },
                    { value: 'done' as const, label: t('labels.status.done') },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => setIStatus(opt.value)}
                      className={`flex-1 px-2 py-1 text-[10px] font-medium transition-colors ${
                        iStatus === opt.value ? 'bg-primary text-white' : 'text-text-secondary hover:bg-[var(--bg-hover)]'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.criticalPath')}</label>
                <div className="flex mt-0.5 border border-border rounded overflow-hidden">
                  {([
                    { value: null, label: t('common.auto') },
                    { value: true, label: t('common.yes') },
                    { value: false, label: t('common.no') },
                  ] as const).map(opt => (
                    <button key={String(opt.value)} onClick={() => setICriticalPathOverride(opt.value)}
                      className={`flex-1 px-2 py-1 text-[10px] font-medium transition-colors ${
                        iCriticalPathOverride === opt.value ? 'bg-primary text-white' : 'text-text-secondary hover:bg-[var(--bg-hover)]'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {modules.capabilities && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-text-tertiary uppercase">{t('forms.capabilities')}</label>
                    <AutoLinkButton
                      initiativeName={iName}
                      initiativeDescription={iDesc}
                      capabilities={capabilities}
                      selectedCapIds={iCaps}
                      onToggleCapability={(capId) => toggleItem(iCaps, capId, setICaps)}
                    />
                  </div>
                  {capabilities.length > 5 && (
                    <input
                      value={capSearch}
                      onChange={e => setCapSearch(e.target.value)}
                      placeholder={t('forms.searchCapabilities')}
                      className="w-full px-1.5 py-0.5 text-[9px] border border-border rounded mt-0.5 mb-0.5 focus:outline-none focus:border-primary"
                    />
                  )}
                  <div className="flex flex-wrap gap-1 mt-0.5 max-h-20 overflow-y-auto">
                    {capabilities.filter(c => c.name.toLowerCase().includes(capSearch.toLowerCase())).map(c => (
                      <button key={c.id} onClick={() => toggleItem(iCaps, c.id, setICaps)}
                        className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                          iCaps.includes(c.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-tertiary'
                        }`}>{c.name}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.dependsOn')}</label>
                <div className="flex flex-wrap gap-1 mt-0.5 max-h-16 overflow-y-auto">
                  {initiatives.map(i => (
                    <button key={i.id} onClick={() => toggleItem(iDeps, i.id, setIDeps)}
                      className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                        iDeps.includes(i.id) ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-border text-text-tertiary'
                      }`}>{i.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.valueChains')}</label>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {valueChains.map(vc => (
                    <button key={vc.id} onClick={() => toggleItem(iVCs, vc.id, setIVCs)}
                      className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                        iVCs.includes(vc.id) ? 'text-white' : 'border-border text-text-tertiary'
                      }`}
                      style={iVCs.includes(vc.id) ? { backgroundColor: vc.color, borderColor: vc.color } : undefined}>
                      {vc.name}
                    </button>
                  ))}
                </div>
                {!showInlineVC ? (
                  <button type="button" onClick={() => setShowInlineVC(true)}
                    className="mt-1 text-[9px] text-primary hover:text-primary-dark font-medium">
                    {t('addModal.newValueChain')}
                  </button>
                ) : (
                  <div className="mt-1.5 p-2 border border-border rounded bg-[var(--bg-lane)] space-y-1.5">
                    <input value={inlineVCName} onChange={e => setInlineVCName(e.target.value)}
                      placeholder={t('addModal.valueChainPlaceholder')}
                      className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary bg-card"
                      autoFocus />
                    <ColorPalette value={inlineVCColor} onChange={setInlineVCColor} />
                    <div className="flex gap-1">
                      <Button variant="primary" size="sm" onClick={handleInlineVCCreate} disabled={!inlineVCName.trim()}>{t('common.create')}</Button>
                      <Button size="sm" onClick={() => { setShowInlineVC(false); setInlineVCName(''); }}>{t('common.cancel')}</Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-1 pt-2">
                <Button variant="primary" size="md" onClick={() => handleAddInitiative(false)} disabled={!iName.trim()}>{t('addModal.createInitiative')}</Button>
                <Button size="md" onClick={() => handleAddInitiative(true)} disabled={!iName.trim()}>{t('addModal.createAndNew')}</Button>
                <Button size="md" onClick={() => setAddModalOpen(false)}>{t('common.cancel')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'capability' && (
            <div className="space-y-2">
              <AIFormAssist tabType="capability" onSuggestion={(data) => {
                if (data.name) setCName(data.name as string);
                if (data.description) setCDesc(data.description as string);
                if (data.level === 1 || data.level === 2) setCLevel(data.level as 1 | 2);
                if (typeof data.maturity === 'number' && [1, 2, 3].includes(data.maturity)) setCMat(data.maturity as 1 | 2 | 3);
                if (typeof data.risk === 'number' && [1, 2, 3].includes(data.risk)) setCRisk(data.risk as 1 | 2 | 3);
                if (data.suggestedParent) {
                  const parent = capabilities.find(c => c.level === 1 && c.name.toLowerCase() === (data.suggestedParent as string).toLowerCase());
                  if (parent) setCParent(parent.id);
                }
              }} />
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.nameRequired')}</label>
                <input value={cName} onChange={e => setCName(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('common.description')}</label>
                <textarea value={cDesc} onChange={e => setCDesc(e.target.value)} rows={2}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('common.level')}</label>
                  <select value={cLevel} onChange={e => setCLevel(Number(e.target.value) as 1|2)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded">
                    <option value={1}>{t('forms.domainL1')}</option>
                    <option value={2}>{t('forms.subL2')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('forms.maturity')}</label>
                  <select value={cMat} onChange={e => setCMat(Number(e.target.value) as 1|2|3)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded">
                    <option value={1}>{t('labels.maturity.1')}</option>
                    <option value={2}>{t('labels.maturity.2')}</option>
                    <option value={3}>{t('labels.maturity.3')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('forms.maturityTarget')}</label>
                  <select value={cMatTarget} onChange={e => setCMatTarget(Number(e.target.value) as 1|2|3)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded">
                    <option value={1}>{t('labels.maturity.1')}</option>
                    <option value={2}>{t('labels.maturity.2')}</option>
                    <option value={3}>{t('labels.maturity.3')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('forms.risk')}</label>
                  <select value={cRisk} onChange={e => setCRisk(Number(e.target.value) as 1|2|3)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded">
                    <option value={1}>{t('labels.risk.1')}</option>
                    <option value={2}>{t('labels.risk.2')}</option>
                    <option value={3}>{t('labels.risk.3')}</option>
                  </select>
                </div>
              </div>
              {cLevel === 2 && (
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('forms.parent')}</label>
                  <select value={cParent} onChange={e => setCParent(e.target.value)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded">
                    <option value="">{t('forms.selectParent')}</option>
                    {l1Caps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-1 pt-2">
                <Button variant="primary" size="md" onClick={() => handleAddCapability(false)} disabled={!cName.trim()}>{t('addModal.createCapability')}</Button>
                <Button size="md" onClick={() => handleAddCapability(true)} disabled={!cName.trim()}>{t('addModal.createAndNew')}</Button>
                <Button size="md" onClick={() => setAddModalOpen(false)}>{t('common.cancel')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'milestone' && (
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.nameRequired')}</label>
                <input value={mName} onChange={e => setMName(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('labels.horizon.label')}</label>
                  <select value={mHorizon} onChange={e => setMHorizon(e.target.value as Horizon)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded">
                    <option value="near">{t('labels.horizon.near')}</option>
                    <option value="far">{t('labels.horizon.far')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('common.color')}</label>
                  <ColorPalette value={mColor} onChange={setMColor} />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('common.position')} ({Math.round(mPosition * 100)}%)</label>
                <input type="range" min={0} max={1} step={0.05} value={mPosition}
                  onChange={e => setMPosition(Number(e.target.value))} className="w-full" />
              </div>
              <div className="flex gap-1 pt-2">
                <Button variant="primary" size="md" onClick={() => handleAddMilestone(false)} disabled={!mName.trim()}>{t('addModal.createMilestone')}</Button>
                <Button size="md" onClick={() => handleAddMilestone(true)} disabled={!mName.trim()}>{t('addModal.createAndNew')}</Button>
                <Button size="md" onClick={() => setAddModalOpen(false)}>{t('common.cancel')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'valuechain' && (
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.nameRequired')}</label>
                <input value={vcName} onChange={e => setVCName(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('common.color')}</label>
                <ColorPalette value={vcColor} onChange={setVCColor} />
              </div>
              <div className="flex gap-1 pt-2">
                <Button variant="primary" size="md" onClick={() => handleAddValueChain(false)} disabled={!vcName.trim()}>{t('addModal.createValueChain')}</Button>
                <Button size="md" onClick={() => handleAddValueChain(true)} disabled={!vcName.trim()}>{t('addModal.createAndNew')}</Button>
                <Button size="md" onClick={() => setAddModalOpen(false)}>{t('common.cancel')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'effect' && (
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.nameRequired')}</label>
                <input value={eName} onChange={e => setEName(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('effects.effect')}</label>
                <select value={eType} onChange={e => setEType(e.target.value as EffectType)}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded">
                  {(['cost', 'quality', 'speed', 'compliance', 'strategic'] as const).map(et => (
                    <option key={et} value={et}>{t(`effects.types.${et}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('common.description')}</label>
                <textarea value={eDesc} onChange={e => setEDesc(e.target.value)} rows={2}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('effects.indicator')}</label>
                <input value={eIndicator} onChange={e => setEIndicator(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('effects.baseline')}</label>
                  <input value={eBaseline} onChange={e => setEBaseline(e.target.value)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[9px] text-text-tertiary uppercase">{t('effects.target')}</label>
                  <input value={eTarget} onChange={e => setETarget(e.target.value)}
                    className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('effects.linkedCapabilities')}</label>
                {capabilities.length > 5 && (
                  <input
                    value={capSearch}
                    onChange={e => setCapSearch(e.target.value)}
                    placeholder={t('forms.searchCapabilities')}
                    className="w-full px-1.5 py-0.5 text-[9px] border border-border rounded mt-0.5 mb-0.5 focus:outline-none focus:border-primary"
                  />
                )}
                <div className="flex flex-wrap gap-1 mt-0.5 max-h-20 overflow-y-auto">
                  {capabilities.filter(c => c.name.toLowerCase().includes(capSearch.toLowerCase())).map(c => (
                    <button key={c.id} onClick={() => toggleItem(eCaps, c.id, setECaps)}
                      className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                        eCaps.includes(c.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-tertiary'
                      }`}>{c.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('effects.linkedInitiatives')}</label>
                <div className="flex flex-wrap gap-1 mt-0.5 max-h-16 overflow-y-auto">
                  {initiatives.map(i => (
                    <button key={i.id} onClick={() => toggleItem(eInits, i.id, setEInits)}
                      className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                        eInits.includes(i.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-tertiary'
                      }`}>{i.name}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 pt-2">
                <Button variant="primary" size="md" onClick={() => handleAddEffect(false)} disabled={!eName.trim()}>{t('addModal.createEffect')}</Button>
                <Button size="md" onClick={() => handleAddEffect(true)} disabled={!eName.trim()}>{t('addModal.createAndNew')}</Button>
                <Button size="md" onClick={() => setAddModalOpen(false)}>{t('common.cancel')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'goal' && (
            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('forms.nameRequired')}</label>
                <input value={gName} onChange={e => setGName(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[9px] text-text-tertiary uppercase">{t('common.description')}</label>
                <textarea value={gDesc} onChange={e => setGDesc(e.target.value)} rows={2}
                  className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-1 pt-2">
                <Button variant="primary" size="md" onClick={() => handleAddGoal(false)} disabled={!gName.trim()}>{t('addModal.createGoal')}</Button>
                <Button size="md" onClick={() => handleAddGoal(true)} disabled={!gName.trim()}>{t('addModal.createAndNew')}</Button>
                <Button size="md" onClick={() => setAddModalOpen(false)}>{t('common.cancel')}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
