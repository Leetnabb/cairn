import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../providers/AuthProvider';
import i18n from '../../i18n';

function initials(email: string | null | undefined): string {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (local[0] ?? '?').toUpperCase();
}

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = i18n.language === 'nb' ? 'nb' : 'en';

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="text-[10px] font-medium text-primary hover:underline px-2 py-1"
      >
        {t('auth.login')}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-semibold hover:opacity-90 transition-opacity"
        title={user?.email ?? ''}
        aria-label={user?.email ?? t('auth.login')}
      >
        {initials(user?.email)}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50">
          {user?.email && (
            <div className="px-3 py-1.5 text-[10px] text-text-tertiary truncate" title={user.email}>
              {user.email}
            </div>
          )}
          <div className="border-t border-border my-1" />
          <div className="px-3 py-1 text-[9px] text-text-tertiary uppercase tracking-wider font-medium">
            {t('auth.language')}
          </div>
          <button
            onClick={() => { i18n.changeLanguage('nb'); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)] flex items-center justify-between"
          >
            <span>Norsk bokmål</span>
            {currentLang === 'nb' && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
          <button
            onClick={() => { i18n.changeLanguage('en'); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)] flex items-center justify-between"
          >
            <span>English</span>
            {currentLang === 'en' && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
          <div className="border-t border-border my-1" />
          <button
            onClick={async () => { setOpen(false); await signOut(); navigate('/login'); }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)]"
          >
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
