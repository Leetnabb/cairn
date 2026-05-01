import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';

export function StrategicFrameEditor() {
  const { t } = useTranslation();
  const frame = useStore((s) => s.strategicFrame);
  const setFrame = useStore((s) => s.setStrategicFrame);
  const updateDirection = useStore((s) => s.updateStrategicDirection);
  const addTheme = useStore((s) => s.addStrategicTheme);
  const updateTheme = useStore((s) => s.updateStrategicTheme);
  const deleteTheme = useStore((s) => s.deleteStrategicTheme);
  const [newThemeName, setNewThemeName] = useState('');

  if (!frame) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">{t('strategicFrame.empty')}</p>
        <button
          onClick={() => setFrame({ direction: '', goals: [], themes: [] })}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          {t('strategicFrame.create')}
        </button>
      </div>
    );
  }

  const handleAddTheme = () => {
    if (!newThemeName.trim()) return;
    addTheme({ id: `st_${Date.now()}`, name: newThemeName.trim(), description: '', goalIds: [] });
    setNewThemeName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          {t('strategicFrame.direction')}
        </label>
        <textarea
          value={frame.direction}
          onChange={(e) => updateDirection(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm"
          rows={3}
          placeholder={t('strategicFrame.directionPlaceholder')}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('strategicFrame.themes')}
        </label>
        <div className="space-y-2">
          {frame.themes.map((theme) => (
            <div key={theme.id} className="flex items-center gap-2">
              <input
                value={theme.name}
                onChange={(e) => updateTheme(theme.id, { name: e.target.value })}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                onClick={() => deleteTheme(theme.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
            placeholder={t('strategicFrame.newThemePlaceholder')}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button
            onClick={handleAddTheme}
            className="px-3 py-1 bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] rounded text-sm"
          >
            {t('common.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
