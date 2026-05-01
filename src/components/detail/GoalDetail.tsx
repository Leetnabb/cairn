import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import type { StrategicGoal } from '../../types';
import { Button } from '../ui/Button';

interface Props {
  goal: StrategicGoal;
}

export function GoalDetail({ goal }: Props) {
  const { t } = useTranslation();
  const updateGoal = useStore(s => s.updateGoal);
  const deleteGoal = useStore(s => s.deleteGoal);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const themes = useStore(s => s.strategicFrame?.themes ?? []);
  const roleMode = useStore(s => s.ui.roleMode);
  const isGovernance = roleMode === 'governance';

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editDesc, setEditDesc] = useState(goal.description);

  const linkedThemes = themes.filter(t => goal.themeIds.includes(t.id));

  const handleSave = () => {
    updateGoal(goal.id, {
      name: editName.trim() || goal.name,
      description: editDesc.trim(),
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(t('detail.confirmDelete', { name: goal.name }))) {
      deleteGoal(goal.id);
      setSelectedItem(null);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 space-y-2">
        <div className="text-[12px] font-semibold mb-2">{t('goal.singular')}</div>
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('common.name')}</label>
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('common.description')}</label>
          <textarea
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            rows={2}
            className="w-full px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-primary resize-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave}>{t('common.save')}</Button>
          <Button onClick={() => setIsEditing(false)}>{t('common.cancel')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-0.5">{t('goal.singular')}</div>
          <h3 className="text-[14px] font-semibold">{goal.name}</h3>
        </div>
        {!isGovernance && (
          <div className="flex gap-1">
            <Button onClick={() => setIsEditing(true)}>&#10000;</Button>
            <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        )}
      </div>

      {goal.description && (
        <p className="text-[11px] text-text-secondary">{goal.description}</p>
      )}

      <div>
        <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('goal.linkedThemes')}</div>
        {linkedThemes.length === 0 ? (
          <p className="text-[10px] text-text-tertiary italic">{t('goal.noLinkedThemes')}</p>
        ) : (
          <div className="space-y-0.5">
            {linkedThemes.map(th => (
              <div
                key={th.id}
                className="block w-full text-left px-2 py-1 text-[10px] rounded text-primary"
              >
                {th.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
