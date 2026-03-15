import { useState, useRef, useEffect } from 'react';
import type { AppState } from '../../types';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';

const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
import { exportJson } from '../../lib/exportJson';
import { exportCapabilitiesCsv, exportInitiativesCsv, exportEffectsCsv } from '../../lib/exportCsv';
import { exportPptx } from '../../lib/exportPptx';
import { validateImport } from '../../lib/importData';
import { Button } from '../ui/Button';

export function ImportModal() {
  const { t } = useTranslation();
  const setImportModalOpen = useStore(s => s.setImportModalOpen);
  const importState = useStore(s => s.importState);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const effects = useStore(s => s.effects);
  const filters = useStore(s => s.ui.filters);
  const state = useStore(s => s);

  const hasActiveFilters = filters.dimensions.length > 0 || filters.horizon !== 'all' || !!filters.owner || !!filters.search || !!filters.status;
  const [exportFiltered, setExportFiltered] = useState<boolean>(hasActiveFilters);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImportModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setImportModalOpen]);

  const [errors, setErrors] = useState<string[]>([]);
  const [importText, setImportText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const activeFilters = exportFiltered ? filters : undefined;

  const handleExportJson = () => {
    const { ui: _ui, ...rest } = state;
    exportJson(rest as AppState);
  };

  const handleExportCsv = () => {
    exportCapabilitiesCsv(capabilities);
    setTimeout(() => exportInitiativesCsv(initiatives, activeFilters), 100);
    setTimeout(() => exportEffectsCsv(effects), 200);
  };

  const handleExportPptx = () => {
    exportPptx(capabilities, initiatives, effects, activeFilters);
  };

  const handleImport = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const result = validateImport(parsed);
      if (!result.valid) {
        setErrors(result.errors);
        return;
      }
      importState(result.data!);
      setImportModalOpen(false);
    } catch {
      setErrors([t('importModal.invalidJson')]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setErrors([t('importModal.fileTooLarge')]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      handleImport(reader.result);
    };
    reader.onerror = () => {
      setErrors([t('importModal.fileReadError')]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setImportModalOpen(false)}>
      <div className="bg-white rounded-lg shadow-lg w-[480px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[13px] font-semibold">{t('importModal.title')}</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Export section */}
          <div>
            <h3 className="text-[11px] font-semibold mb-2">{t('importModal.export')}</h3>

            {/* Filter toggle */}
            {hasActiveFilters && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportFiltered}
                  onChange={e => setExportFiltered(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-[10px] text-text-secondary">{t('importModal.exportFiltered')}</span>
              </label>
            )}

            <div className="flex gap-2">
              <Button size="md" onClick={handleExportJson}>{t('importModal.json')}</Button>
              <Button size="md" onClick={handleExportCsv}>{t('importModal.csv')}</Button>
              <Button size="md" onClick={handleExportPptx}>{t('importModal.powerpoint')}</Button>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Import section */}
          <div>
            <h3 className="text-[11px] font-semibold mb-2">{t('importModal.importJson')}</h3>
            <div className="space-y-2">
              <div>
                <input type="file" accept=".json" ref={fileRef} onChange={handleFileUpload} className="hidden" />
                <Button size="md" onClick={() => fileRef.current?.click()}>{t('importModal.uploadFile')}</Button>
              </div>
              <div className="text-[9px] text-text-tertiary">{t('importModal.pasteJson')}</div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={6}
                className="w-full px-2 py-1 text-[10px] font-mono border border-border rounded focus:outline-none focus:border-primary resize-none"
                placeholder='{"capabilities": [...], "scenarios": [...], ...}'
              />
              <Button variant="primary" size="md" onClick={() => handleImport(importText)} disabled={!importText.trim()}>
                {t('common.import')}
              </Button>
              {errors.length > 0 && (
                <div className="px-2 py-1.5 rounded bg-red-50 border border-red-200">
                  {errors.map((e, i) => (
                    <div key={i} className="text-[10px] text-red-700">{e}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 py-2 border-t border-border flex justify-end">
          <Button onClick={() => setImportModalOpen(false)}>{t('common.close')}</Button>
        </div>
      </div>
    </div>
  );
}
