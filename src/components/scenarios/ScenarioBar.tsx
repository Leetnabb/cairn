import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { Button } from '../ui/Button';

export function ScenarioBar() {
  const { t } = useTranslation();
  const scenarios = useStore(s => s.scenarios);
  const activeScenario = useStore(s => s.activeScenario);
  const setActiveScenario = useStore(s => s.setActiveScenario);
  const addScenario = useStore(s => s.addScenario);
  const updateScenario = useStore(s => s.updateScenario);
  const deleteScenario = useStore(s => s.deleteScenario);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = () => {
    const id = `scenario_${Date.now()}`;
    addScenario({ id, name: t('scenarios.newScenario'), color: '#8b5cf6' });
    setActiveScenario(id);
  };

  const handleDuplicate = () => {
    const id = `scenario_${Date.now()}`;
    const active = scenarios.find(s => s.id === activeScenario);
    addScenario({ id, name: t('scenarios.copyName', { name: active?.name ?? 'Scenario' }), color: '#8b5cf6' }, activeScenario);
    setActiveScenario(id);
  };

  const handleStartRename = (id: string) => {
    const s = scenarios.find(sc => sc.id === id);
    setRenamingId(id);
    setRenameValue(s?.name ?? '');
  };

  const handleFinishRename = () => {
    if (renamingId && renameValue.trim()) {
      updateScenario(renamingId, { name: renameValue.trim() });
    }
    setRenamingId(null);
  };

  const handleDelete = (id: string) => {
    if (scenarios.length <= 1) return;
    if (confirm(t('scenarios.confirmDelete'))) {
      deleteScenario(id);
    }
  };

  return (
    <div className="flex items-center gap-1 px-4 py-1 bg-white border-b border-border shrink-0">
      <span className="text-[9px] text-text-tertiary uppercase mr-1">{t('scenarios.label')}</span>
      {scenarios.map(s => (
        <div key={s.id} className="flex items-center">
          {renamingId === s.id ? (
            <input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={e => e.key === 'Enter' && handleFinishRename()}
              autoFocus
              className="px-2 py-0.5 text-[10px] border border-primary rounded w-28 focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setActiveScenario(s.id)}
              onDoubleClick={() => handleStartRename(s.id)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-150 ${
                activeScenario === s.id
                  ? 'text-white'
                  : 'text-text-secondary hover:bg-gray-100'
              }`}
              style={activeScenario === s.id ? { backgroundColor: s.color } : undefined}
            >
              {s.name}
            </button>
          )}
          {scenarios.length > 1 && activeScenario === s.id && (
            <button
              onClick={() => handleDelete(s.id)}
              className="ml-0.5 text-[9px] text-text-tertiary hover:text-red-500"
            >
              &times;
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-0.5 ml-2">
        <Button onClick={handleCreate}>{t('scenarios.addNew')}</Button>
        <Button onClick={handleDuplicate}>{t('scenarios.duplicate')}</Button>
      </div>
    </div>
  );
}
