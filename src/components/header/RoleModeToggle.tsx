import { useTranslation } from 'react-i18next';

export function RoleModeToggle() {
  const { t } = useTranslation();

  return (
    <button
      className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors text-text-secondary hover:bg-[var(--bg-hover)]"
      title={t('board.title')}
      aria-label={t('board.title')}
      disabled
    >
      {/* Frame/screen icon */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      {t('board.title')}
    </button>
  );
}
