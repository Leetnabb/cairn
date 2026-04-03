import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import type { Strategy } from '../../types';
import { Button } from '../ui/Button';

interface Props {
  strategy: Strategy;
}

const TIME_HORIZON_COLOR: Record<Strategy['timeHorizon'], string> = {
  short: '#22c55e',
  medium: '#f59e0b',
  long: '#6366f1',
};

export function StrategyDetail({ strategy }: Props) {
  const { t } = useTranslation();
  const updateStrategy = useStore(s => s.updateStrategy);
  const deleteStrategy = useStore(s => s.deleteStrategy);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const capabilities = useStore(s => s.capabilities);
  const roleMode = useStore(s => s.ui.roleMode);
  const isGovernance = roleMode === 'governance';

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(strategy.name);
  const [editDesc, setEditDesc] = useState(strategy.description);
  const [editHorizon, setEditHorizon] = useState<Strategy['timeHorizon']>(strategy.timeHorizon);
  const [editPriority, setEditPriority] = useState<Strategy['priority']>(strategy.priority);

  const linkedCapabilities = capabilities.filter(c => c.strategyIds?.includes(strategy.id));

  const handleSave = () => {
    updateStrategy(strategy.id, {
      name: editName.trim() || strategy.name,
      description: editDesc.trim(),
      timeHorizon: editHorizon,
      priority: editPriority,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(t('detail.confirmDelete', { name: strategy.name }))) {
      deleteStrategy(strategy.id);
      setSelectedItem(null);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 space-y-2">
        <div className="text-[12px] font-semibold mb-2">{t('strategy.singular')}</div>
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
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('strategy.timeHorizon')}</label>
          <select
            value={editHorizon}
            onChange={e => setEditHorizon(e.target.value as Strategy['timeHorizon'])}
            className="w-full px-2 py-1 text-[11px] border border-border rounded"
          >
            <option value="short">{t('strategy.short')}</option>
            <option value="medium">{t('strategy.medium')}</option>
            <option value="long">{t('strategy.long')}</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-text-tertiary uppercase">{t('strategy.priority')}</label>
          <div className="flex mt-0.5 border border-border rounded overflow-hidden">
            {([1, 2, 3] as const).map(p => (
              <button
                key={p}
                onClick={() => setEditPriority(p)}
                className={`flex-1 px-2 py-1 text-[10px] font-medium transition-colors ${
                  editPriority === p ? 'bg-primary text-white' : 'text-text-secondary hover:bg-[var(--bg-hover)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
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
          <div className="text-[9px] text-text-tertiary uppercase mb-0.5">{t('strategy.singular')}</div>
          <h3 className="text-[14px] font-semibold">{strategy.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: TIME_HORIZON_COLOR[strategy.timeHorizon] }}
            />
            <span className="text-[9px] text-text-tertiary">{t(`strategy.${strategy.timeHorizon}`)}</span>
            <span className="text-[9px] text-text-tertiary">·</span>
            <span className="text-[9px] text-text-tertiary">{t('strategy.priority')} {strategy.priority}</span>
          </div>
        </div>
        {!isGovernance && (
          <div className="flex gap-1">
            <Button onClick={() => setIsEditing(true)}>&#10000;</Button>
            <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        )}
      </div>

      {strategy.description && (
        <p className="text-[11px] text-text-secondary">{strategy.description}</p>
      )}

      <div>
        <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('strategy.linkedCapabilities')}</div>
        {linkedCapabilities.length === 0 ? (
          <p className="text-[10px] text-text-tertiary italic">{t('strategy.noLinkedCapabilities')}</p>
        ) : (
          <div className="space-y-0.5">
            {linkedCapabilities.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedItem({ type: 'capability', id: c.id })}
                className="block w-full text-left px-2 py-1 text-[10px] rounded hover:bg-[var(--bg-hover)] text-primary"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
