import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { Button } from '../ui/Button';
import type { Capability } from '../../types';

interface Props {
  capability: Capability;
}

export function EditCapabilityForm({ capability }: Props) {
  const { t } = useTranslation();
  const updateCapability = useStore(s => s.updateCapability);
  const setEditingId = useStore(s => s.setEditingId);
  const capabilities = useStore(s => s.capabilities);

  const [name, setName] = useState(capability.name);
  const [description, setDescription] = useState(capability.description);
  const [maturity, setMaturity] = useState(capability.maturity);
  const [risk, setRisk] = useState(capability.risk);
  const [parent, setParent] = useState(capability.parent ?? '');

  const l1Caps = capabilities.filter(c => c.level === 1 && c.id !== capability.id);

  const handleSave = () => {
    updateCapability(capability.id, {
      name,
      description,
      maturity: maturity as 1 | 2 | 3,
      risk: risk as 1 | 2 | 3,
      parent: capability.level === 2 ? (parent || null) : null,
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
        <label className="text-[9px] text-text-tertiary uppercase">{t('common.description')}</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('forms.maturity')}</label>
          <select value={maturity} onChange={e => setMaturity(Number(e.target.value) as 1|2|3)} className="w-full px-2 py-1 text-[11px] border border-border rounded">
            <option value={1}>{t('labels.maturity.1')}</option>
            <option value={2}>{t('labels.maturity.2')}</option>
            <option value={3}>{t('labels.maturity.3')}</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('forms.risk')}</label>
          <select value={risk} onChange={e => setRisk(Number(e.target.value) as 1|2|3)} className="w-full px-2 py-1 text-[11px] border border-border rounded">
            <option value={1}>{t('labels.risk.1')}</option>
            <option value={2}>{t('labels.risk.2')}</option>
            <option value={3}>{t('labels.risk.3')}</option>
          </select>
        </div>
      </div>
      {capability.level === 2 && (
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('forms.parent')}</label>
          <select value={parent} onChange={e => setParent(e.target.value)} className="w-full px-2 py-1 text-[11px] border border-border rounded">
            <option value="">{t('common.none')}</option>
            {l1Caps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-1 pt-1">
        <Button variant="primary" onClick={handleSave}>{t('common.save')}</Button>
        <Button onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
      </div>
    </div>
  );
}
