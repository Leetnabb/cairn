import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { Button } from '../ui/Button';
import { DIMENSIONS } from '../../types';
import type { Initiative, DimensionKey, InitiativeStatus, ConfidenceLevel, Horizon } from '../../types';

interface Props {
  initiative: Initiative;
}

export function EditInitiativeForm({ initiative }: Props) {
  const { t } = useTranslation();
  const updateInitiative = useStore(s => s.updateInitiative);
  const setEditingId = useStore(s => s.setEditingId);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const valueChains = useStore(s => s.valueChains);
  const modules = useStore(s => s.modules);

  const [name, setName] = useState(initiative.name);
  const [description, setDescription] = useState(initiative.description);
  const [dimension, setDimension] = useState<DimensionKey>(initiative.dimension);
  const [horizon, setHorizon] = useState<Horizon>(initiative.horizon);
  const [owner, setOwner] = useState(initiative.owner);
  const [notes, setNotes] = useState(initiative.notes);
  const [selectedCaps, setSelectedCaps] = useState<string[]>(initiative.capabilities);
  const [selectedDeps, setSelectedDeps] = useState<string[]>(initiative.dependsOn);
  const [selectedVCs, setSelectedVCs] = useState<string[]>(initiative.valueChains);
  const [status, setStatus] = useState<InitiativeStatus>(initiative.status ?? 'planned');
  const [confidence, setConfidence] = useState<ConfidenceLevel>(initiative.confidence ?? 'confirmed');
  const [criticalPathOverride, setCriticalPathOverride] = useState<boolean | null>(initiative.criticalPathOverride ?? null);
  const [capSearch, setCapSearch] = useState('');

  const otherInitiatives = initiatives.filter(i => i.id !== initiative.id);
  const filteredCaps = capabilities.filter(c => c.name.toLowerCase().includes(capSearch.toLowerCase()));

  const handleSave = () => {
    updateInitiative(initiative.id, {
      name, description, dimension, horizon, owner, notes, status, confidence,
      capabilities: selectedCaps,
      dependsOn: selectedDeps,
      valueChains: selectedVCs,
      criticalPathOverride,
    });
    setEditingId(null);
  };

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('common.name')}</label>
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
      </div>
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('common.description')}</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('forms.dimension')}</label>
          <select value={dimension} onChange={e => setDimension(e.target.value as DimensionKey)}
            className="w-full px-2 py-1 text-[11px] border border-border rounded">
            {DIMENSIONS.map(d => <option key={d.key} value={d.key}>{t(`labels.dimensions.${d.key}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('labels.horizon.label')}</label>
          <select value={horizon} onChange={e => setHorizon(e.target.value as Horizon)}
            className="w-full px-2 py-1 text-[11px] border border-border rounded">
            <option value="near">{t('labels.horizon.near')}</option>
            <option value="far">{t('labels.horizon.far')}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('common.owner')}</label>
        <input value={owner} onChange={e => setOwner(e.target.value)}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary" />
      </div>
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('forms.notes')}</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none" />
      </div>
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('labels.status.label')}</label>
        <div className="flex mt-0.5 border border-border rounded overflow-hidden">
          {([
            { value: 'planned' as const, label: t('labels.status.planned') },
            { value: 'in_progress' as const, label: t('labels.status.in_progress') },
            { value: 'done' as const, label: t('labels.status.done') },
            { value: 'stopped' as const, label: t('labels.status.stopped') },
            { value: 'changed_direction' as const, label: t('labels.status.changed_direction') },
          ]).map(opt => (
            <button key={opt.value} onClick={() => setStatus(opt.value)}
              className={`flex-1 px-2 py-1 text-[10px] font-medium transition-colors ${
                status === opt.value ? 'bg-primary text-white' : 'text-text-secondary hover:bg-[var(--bg-hover)]'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('confidence.label')}</label>
        <div className="flex mt-0.5 border border-border rounded overflow-hidden">
          {([
            { value: 'confirmed' as const, label: t('confidence.confirmed') },
            { value: 'tentative' as const, label: t('confidence.tentative') },
            { value: 'under_consideration' as const, label: t('confidence.under_consideration') },
          ]).map(opt => (
            <button key={opt.value} onClick={() => setConfidence(opt.value)}
              className={`flex-1 px-1.5 py-1 text-[9px] font-medium transition-colors ${
                confidence === opt.value ? 'bg-primary text-white' : 'text-text-secondary hover:bg-[var(--bg-hover)]'
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
            <button key={String(opt.value)} onClick={() => setCriticalPathOverride(opt.value)}
              className={`flex-1 px-2 py-1 text-[10px] font-medium transition-colors ${
                criticalPathOverride === opt.value ? 'bg-primary text-white' : 'text-text-secondary hover:bg-[var(--bg-hover)]'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {modules.capabilities && (
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('forms.capabilities')}</label>
          {capabilities.length > 5 && (
            <input
              value={capSearch}
              onChange={e => setCapSearch(e.target.value)}
              placeholder={t('forms.searchCapabilities')}
              className="w-full px-1.5 py-0.5 text-[9px] border border-border rounded mt-0.5 mb-0.5 focus:outline-none focus:border-primary"
            />
          )}
          <div className="flex flex-wrap gap-1 mt-0.5 max-h-20 overflow-y-auto">
            {filteredCaps.map(c => (
              <button key={c.id} onClick={() => toggleItem(selectedCaps, c.id, setSelectedCaps)}
                className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                  selectedCaps.includes(c.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-tertiary hover:border-[var(--border-medium)]'
                }`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('forms.dependsOn')}</label>
        <div className="flex flex-wrap gap-1 mt-0.5 max-h-16 overflow-y-auto">
          {otherInitiatives.map(i => (
            <button key={i.id} onClick={() => toggleItem(selectedDeps, i.id, setSelectedDeps)}
              className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                selectedDeps.includes(i.id) ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-border text-text-tertiary hover:border-[var(--border-medium)]'
              }`}>
              {i.name}
            </button>
          ))}
        </div>
      </div>
      {valueChains.length > 0 && (
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('forms.valueChains')}</label>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {valueChains.map(vc => (
              <button key={vc.id} onClick={() => toggleItem(selectedVCs, vc.id, setSelectedVCs)}
                className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                  selectedVCs.includes(vc.id) ? 'text-white' : 'border-border text-text-tertiary hover:border-[var(--border-medium)]'
                }`}
                style={selectedVCs.includes(vc.id) ? { backgroundColor: vc.color, borderColor: vc.color } : undefined}>
                {vc.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-1 pt-1">
        <Button variant="primary" onClick={handleSave}>{t('common.save')}</Button>
        <Button onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
      </div>
    </div>
  );
}
