import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiClient } from '../../hooks/useApiClient';

interface OrgData {
  id: string;
  slug: string;
  display_name: string;
  plan: string;
}

export function OrganisationTab() {
  const { t } = useTranslation();
  const api = useApiClient();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<OrgData>('/settings/org').then(data => {
      setOrg(data);
      setDisplayName(data.display_name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!org || displayName === org.display_name) return;
    setSaving(true);
    try {
      const updated = await api.patch<OrgData>('/settings/org', { displayName });
      setOrg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-[11px] text-text-tertiary">{t('common.loading', 'Loading...')}</div>;
  }

  if (!org) {
    return <div className="text-[11px] text-text-tertiary">Organisation data unavailable.</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">
          {t('settings.org.name')}
        </label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">
          {t('settings.org.slug')}
        </label>
        <input
          type="text"
          value={org.slug}
          disabled
          className="w-full px-3 py-2 text-[12px] border border-border rounded-lg bg-gray-50 text-text-tertiary cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">
          {t('settings.org.plan')}
        </label>
        <div className="px-3 py-2 text-[12px] border border-border rounded-lg bg-gray-50 text-text-secondary capitalize">
          {org.plan.toLowerCase()}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || displayName === org.display_name}
          className="px-4 py-2 text-[11px] bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '…' : t('settings.org.save')}
        </button>
        {saved && (
          <span className="text-[11px] text-green-600">{t('settings.org.saved')}</span>
        )}
      </div>
    </div>
  );
}
