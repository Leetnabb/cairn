import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';

const MIGRATION_DONE_KEY = 'cairn_migration_offered';
const STORAGE_KEY = 'cairn-storage';

/**
 * One-time offer to import localStorage data into the user's account.
 * Shown on first login when:
 * - User is authenticated (cairn_access_token present)
 * - localStorage contains Cairn data
 * - Migration has not been offered before (cairn_migration_offered not set)
 */
export function LocalStorageMigration() {
  const { t } = useTranslation();
  // TODO: Replace with Supabase client calls
  const [show, setShow] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const scenarios = useStore(s => s.scenarios);

  useEffect(() => {
    const token = localStorage.getItem('cairn_access_token');
    const alreadyOffered = localStorage.getItem(MIGRATION_DONE_KEY);
    const hasData = localStorage.getItem(STORAGE_KEY);
    const hasLocalScenarios = scenarios.length > 0;

    if (token && !alreadyOffered && hasData && hasLocalScenarios) {
      setShow(true);
    }
  }, []);

  if (!show || done) return null;

  const handleImport = async () => {
    setImporting(true);
    try {
      // TODO: Replace with Supabase client calls
      console.warn('[migration] handleImport: not yet implemented');
      localStorage.setItem(MIGRATION_DONE_KEY, 'true');
      setDone(true);
      setShow(false);
    } catch (err) {
      console.error('[migration] Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    setShow(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md mx-4">
      <div className="bg-white border border-border rounded-xl shadow-xl p-5">
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">
          {t('migration.title')}
        </h3>
        <p className="text-[11px] text-text-secondary mb-4">
          {t('migration.description')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex-1 px-4 py-2 text-[11px] bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {importing ? t('migration.importing') : t('migration.import')}
          </button>
          <button
            onClick={dismiss}
            disabled={importing}
            className="flex-1 px-4 py-2 text-[11px] border border-border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors text-text-secondary"
          >
            {t('migration.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
