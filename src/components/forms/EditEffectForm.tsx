import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { Button } from '../ui/Button';
import type { Effect, EffectType } from '../../types';

interface Props {
  effect: Effect;
}

const EFFECT_TYPES: EffectType[] = ['cost', 'quality', 'speed', 'compliance', 'strategic'];

export function EditEffectForm({ effect }: Props) {
  const { t } = useTranslation();
  const updateEffect = useStore(s => s.updateEffect);
  const setEditingId = useStore(s => s.setEditingId);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const modules = useStore(s => s.modules);

  const [name, setName] = useState(effect.name);
  const [description, setDescription] = useState(effect.description);
  const [type, setType] = useState<EffectType>(effect.type);
  const [indicator, setIndicator] = useState(effect.indicator ?? '');
  const [baseline, setBaseline] = useState(effect.baseline ?? '');
  const [target, setTarget] = useState(effect.target ?? '');
  const [caps, setCaps] = useState<string[]>(effect.capabilities);
  const [inits, setInits] = useState<string[]>(effect.initiatives);
  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSave = () => {
    updateEffect(effect.id, {
      name,
      description,
      type,
      indicator: indicator || undefined,
      baseline: baseline || undefined,
      target: target || undefined,
      capabilities: caps,
      initiatives: inits,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('common.name')}</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('effects.types.cost').split('').length ? t('effects.effect') : ''}</label>
        <select value={type} onChange={e => setType(e.target.value as EffectType)} className="w-full px-2 py-1 text-[11px] border border-border rounded">
          {EFFECT_TYPES.map(et => (
            <option key={et} value={et}>{t(`effects.types.${et}`)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('common.description')}</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div>
        <label className="text-[9px] text-text-tertiary uppercase">{t('effects.indicator')}</label>
        <input
          value={indicator}
          onChange={e => setIndicator(e.target.value)}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('effects.baseline')}</label>
          <input
            value={baseline}
            onChange={e => setBaseline(e.target.value)}
            className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('effects.target')}</label>
          <input
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary"
          />
        </div>
      </div>
      {modules.capabilities && (
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('effects.linkedCapabilities')}</label>
          <div className="flex flex-wrap gap-1 mt-0.5 max-h-20 overflow-y-auto">
            {capabilities.map(c => (
              <button key={c.id} onClick={() => toggleItem(caps, c.id, setCaps)}
                className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                  caps.includes(c.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-tertiary'
                }`}>{c.name}</button>
            ))}
          </div>
        </div>
      )}
      {modules.roadmap && (
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('effects.linkedInitiatives')}</label>
          <div className="flex flex-wrap gap-1 mt-0.5 max-h-20 overflow-y-auto">
            {initiatives.map(i => (
              <button key={i.id} onClick={() => toggleItem(inits, i.id, setInits)}
                className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                  inits.includes(i.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-tertiary'
                }`}>{i.name}</button>
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
