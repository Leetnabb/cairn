import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import type { Milestone } from '../../types';
import { Button } from '../ui/Button';
import { ColorPalette } from '../ui/ColorPalette';

interface Props {
  milestone: Milestone;
}

export function MilestoneDetail({ milestone }: Props) {
  const { t } = useTranslation();
  const editingId = useStore(s => s.ui.editingId);
  const setEditingId = useStore(s => s.setEditingId);
  const deleteMilestone = useStore(s => s.deleteMilestone);
  const setSelectedItem = useStore(s => s.setSelectedItem);

  const isEditing = editingId === milestone.id;

  const handleDelete = () => {
    if (confirm(t('detail.confirmDelete', { name: milestone.name }))) {
      deleteMilestone(milestone.id);
      setSelectedItem(null);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3">
        <h3 className="text-[12px] font-semibold mb-2">{t('detail.editMilestone')}</h3>
        <MilestoneEditForm milestone={milestone} />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: milestone.color }} />
            <span className="text-[9px] text-text-tertiary uppercase">{t('detail.milestone')}</span>
            <span className="text-[9px] text-text-tertiary">&middot;</span>
            <span className="text-[9px] text-text-tertiary">{t(`labels.horizon.${milestone.horizon}`)}</span>
          </div>
          <h3 className="text-[14px] font-semibold">{milestone.name}</h3>
        </div>
        <div className="flex gap-1">
          <Button onClick={() => setEditingId(milestone.id)}>&#10000;</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </div>

      <div className="px-2 py-1 rounded border border-border">
        <div className="text-[9px] text-text-tertiary uppercase">{t('common.position')}</div>
        <div className="text-[11px] font-medium">{Math.round(milestone.position * 100)}%</div>
      </div>
    </div>
  );
}

function MilestoneEditForm({ milestone }: Props) {
  const { t } = useTranslation();
  const updateMilestone = useStore(s => s.updateMilestone);
  const setEditingId = useStore(s => s.setEditingId);

  const [name, setName] = useState(milestone.name);
  const [horizon, setHorizon] = useState(milestone.horizon);
  const [position, setPosition] = useState(milestone.position);
  const [color, setColor] = useState(milestone.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMilestone(milestone.id, { name: name.trim(), horizon, position, color });
    setEditingId(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className="block text-[9px] text-text-tertiary uppercase mb-0.5">{t('common.name')}</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
      </div>

      <div>
        <label className="block text-[9px] text-text-tertiary uppercase mb-0.5">{t('labels.horizon.label')}</label>
        <select
          value={horizon}
          onChange={e => setHorizon(e.target.value as 'near' | 'far')}
          className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="near">{t('labels.horizon.near')}</option>
          <option value="far">{t('labels.horizon.far')}</option>
        </select>
      </div>

      <div>
        <label className="block text-[9px] text-text-tertiary uppercase mb-0.5">{t('common.position')} ({Math.round(position * 100)}%)</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={position}
          onChange={e => setPosition(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-[9px] text-text-tertiary uppercase mb-0.5">{t('common.color')}</label>
        <ColorPalette value={color} onChange={setColor} />
      </div>

      <div className="flex gap-1 pt-1">
        <Button type="submit" variant="primary">{t('common.save')}</Button>
        <Button type="button" onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
      </div>
    </form>
  );
}
