import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
}

export function DataTab({ onClose }: Props) {
  const { t } = useTranslation();
  // TODO: Replace with Supabase client calls
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletionScheduled, setDeletionScheduled] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/v1/settings/data/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('cairn_access_token') ?? ''}`,
        },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cairn-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setRequestingDeletion(true);
    try {
      // TODO: Replace with Supabase client calls
      console.warn('[DataTab] handleRequestDeletion: not yet implemented');
    } finally {
      setRequestingDeletion(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelling(true);
    try {
      // TODO: Replace with Supabase client calls
      console.warn('[DataTab] handleCancelDeletion: not yet implemented');
      setCancelled(true);
      setDeletionScheduled(null);
      setTimeout(() => { setCancelled(false); onClose(); }, 2000);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Export */}
      <div>
        <h3 className="text-[11px] font-semibold text-text-primary mb-1 uppercase tracking-wider">
          {t('settings.data.export')}
        </h3>
        <p className="text-[11px] text-text-secondary mb-3">{t('settings.data.exportDesc')}</p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 text-[11px] border border-border rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-40 transition-colors"
        >
          {exporting ? '…' : t('settings.data.exportBtn')}
        </button>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-lg p-4">
        <h3 className="text-[11px] font-semibold text-red-600 mb-1 uppercase tracking-wider">
          {t('settings.data.danger')}
        </h3>

        {deletionScheduled ? (
          <div className="space-y-3">
            <p className="text-[11px] text-text-secondary">
              {t('settings.data.deletePending', {
                date: new Date(deletionScheduled).toLocaleDateString(),
              })}
            </p>
            <button
              onClick={handleCancelDeletion}
              disabled={cancelling}
              className="px-4 py-2 text-[11px] border border-border rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-40 transition-colors"
            >
              {cancelling ? '…' : t('settings.data.cancelDeletion')}
            </button>
            {cancelled && (
              <p className="text-[11px] text-green-600">{t('settings.data.deletionCancelled')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-text-secondary">{t('settings.data.deleteDesc')}</p>
            <div>
              <label className="block text-[10px] text-text-tertiary mb-1">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="px-3 py-1.5 text-[11px] border border-red-300 rounded-lg focus:outline-none focus:border-red-500 w-40"
              />
            </div>
            <button
              onClick={handleRequestDeletion}
              disabled={deleteConfirm !== 'DELETE' || requestingDeletion}
              className="px-4 py-2 text-[11px] bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {requestingDeletion ? '…' : t('settings.data.deleteBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
