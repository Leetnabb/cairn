import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';

export function RoleModeToggle() {
  const { t } = useTranslation();
  const roleMode = useStore(s => s.ui.roleMode);
  const setRoleMode = useStore(s => s.setRoleMode);

  const isGovernance = roleMode === 'governance';

  return (
    <button
      onClick={() => setRoleMode(isGovernance ? 'work' : 'governance')}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        isGovernance ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-gray-100'
      }`}
      title={isGovernance ? t('nav.roleGovernance') : t('nav.roleWork')}
      aria-label={isGovernance ? t('nav.roleGovernance') : t('nav.roleWork')}
    >
      {isGovernance ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      )}
    </button>
  );
}
