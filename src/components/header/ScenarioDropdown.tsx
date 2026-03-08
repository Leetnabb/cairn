import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';

export function ScenarioDropdown() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const scenarios = useStore(s => s.scenarios);
  const activeScenario = useStore(s => s.activeScenario);
  const setActiveScenario = useStore(s => s.setActiveScenario);
  const addScenario = useStore(s => s.addScenario);
  const updateScenario = useStore(s => s.updateScenario);
  const deleteScenario = useStore(s => s.deleteScenario);

  const active = scenarios.find(s => s.id === activeScenario);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setRenamingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleCreate = () => {
    const id = `scenario_${Date.now()}`;
    addScenario({ id, name: t('scenarios.newScenario'), color: '#8b5cf6' });
    setActiveScenario(id);
  };

  const handleDuplicate = () => {
    const id = `scenario_${Date.now()}`;
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: active?.color ?? '#8b5cf6' }} />
        <span className="text-[11px] font-medium text-text-primary">{active?.name ?? 'Scenario'}</span>
        <span className="text-[9px] text-text-tertiary">{open ? '\u25B4' : '\u25BE'}</span>
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50">
          {scenarios.map(s => (
            <div key={s.id} className="flex items-center px-2 py-0.5 group">
              {renamingId === s.id ? (
                <input
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={e => e.key === 'Enter' && handleFinishRename()}
                  autoFocus
                  className="flex-1 px-2 py-0.5 text-[10px] border border-primary rounded focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => { setActiveScenario(s.id); setOpen(false); }}
                  onDoubleClick={() => handleStartRename(s.id)}
                  className={`flex-1 text-left px-2 py-1 text-[10px] rounded transition-colors ${
                    activeScenario === s.id ? 'font-semibold text-primary' : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </div>
                </button>
              )}
              {scenarios.length > 1 && (
                <button
                  onClick={() => handleDelete(s.id)}
                  className="opacity-0 group-hover:opacity-100 ml-1 text-[9px] text-text-tertiary hover:text-red-500 transition-opacity"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <div className="border-t border-border mt-1 pt-1 px-2 flex gap-1">
            <button onClick={handleCreate} className="flex-1 px-2 py-1 text-[9px] text-text-secondary hover:bg-gray-50 rounded">
              {t('scenarios.addNew')}
            </button>
            <button onClick={handleDuplicate} className="flex-1 px-2 py-1 text-[9px] text-text-secondary hover:bg-gray-50 rounded">
              {t('scenarios.duplicate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
