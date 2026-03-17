import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiClient } from '../../hooks/useApiClient';

interface OrgData {
  id: string;
  slug: string;
  display_name: string;
  plan: string;
  sector: string | null;
  org_sizeband: string | null;
}

const SECTORS = ['public', 'finance', 'energy', 'telecom'] as const;
const SIZE_BANDS = ['small', 'medium', 'large'] as const;

export function OrganisationTab() {
  const { t } = useTranslation();
  const api = useApiClient();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [sector, setSector] = useState<string | null>(null);
  const [orgSizeband, setOrgSizeband] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<OrgData>('/settings/org').then(data => {
      setOrg(data);
      setDisplayName(data.display_name);
      setSector(data.sector);
      setOrgSizeband(data.org_sizeband);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const hasChanges = org && (
    displayName !== org.display_name ||
    sector !== org.sector ||
    orgSizeband !== org.org_sizeband
  );

  const handleSave = async () => {
    if (!org || !hasChanges) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (displayName !== org.display_name) payload.displayName = displayName;
      if (sector !== org.sector) payload.sector = sector;
      if (orgSizeband !== org.org_sizeband) payload.orgSizeband = orgSizeband;

      const updated = await api.patch<OrgData>('/settings/org', payload);
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

      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">
          {t('settings.org.sector', 'Sector')}
        </label>
        <p className="text-[10px] text-text-tertiary mb-1">
          {t('settings.org.sectorDesc', 'Optional. Used for benchmark comparisons with similar organisations.')}
        </p>
        <select
          value={sector ?? ''}
          onChange={e => setSector(e.target.value || null)}
          className="w-full px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
        >
          <option value="">{t('settings.org.notSpecified', 'Not specified')}</option>
          {SECTORS.map(s => (
            <option key={s} value={s}>
              {t(`settings.org.sectors.${s}`, s.charAt(0).toUpperCase() + s.slice(1))}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">
          {t('settings.org.orgSize', 'Organisation size')}
        </label>
        <p className="text-[10px] text-text-tertiary mb-1">
          {t('settings.org.orgSizeDesc', 'Optional. Used for benchmark comparisons with similar-sized organisations.')}
        </p>
        <select
          value={orgSizeband ?? ''}
          onChange={e => setOrgSizeband(e.target.value || null)}
          className="w-full px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
        >
          <option value="">{t('settings.org.notSpecified', 'Not specified')}</option>
          {SIZE_BANDS.map(s => (
            <option key={s} value={s}>
              {t(`settings.org.sizeBands.${s}`, s.charAt(0).toUpperCase() + s.slice(1))}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
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
