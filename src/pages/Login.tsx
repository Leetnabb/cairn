import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

type Mode = 'login' | 'register' | 'reset';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [consentResearch, setConsentResearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(t('auth.loginError'));
        } else {
          navigate('/app', { replace: true });
        }
      } else if (mode === 'register') {
        const { error } = await signUp(email, password, {
          display_name: displayName,
          consent_research: consentResearch,
        });
        if (error) {
          setError(error.message);
        } else {
          setMessage(t('auth.checkEmail'));
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setMessage(t('auth.resetPasswordSent'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const isExpired = searchParams.get('expired') === 'true';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-xl font-bold text-text-primary text-center mb-6">
          {mode === 'login' && t('auth.login')}
          {mode === 'register' && t('auth.register')}
          {mode === 'reset' && t('auth.resetPassword')}
        </h1>

        {isExpired && mode === 'login' && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">{t('auth.sessionExpired')}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('auth.displayName')}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary placeholder:text-text-tertiary"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email')}
            required
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary placeholder:text-text-tertiary"
          />

          {mode !== 'reset' && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              required
              minLength={6}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-surface text-text-primary placeholder:text-text-tertiary"
            />
          )}

          {mode === 'register' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consentResearch}
                onChange={(e) => setConsentResearch(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary"
              />
              <span className="text-xs text-text-secondary">{t('auth.consentResearch')}</span>
            </label>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {message && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '...' : (
              mode === 'login' ? t('auth.login') :
              mode === 'register' ? t('auth.register') :
              t('auth.resetPassword')
            )}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button
                onClick={() => { setMode('reset'); setError(null); setMessage(null); }}
                className="text-xs text-text-tertiary hover:text-primary transition-colors"
              >
                {t('auth.forgotPassword')}
              </button>
              <p className="text-xs text-text-tertiary">
                {t('auth.noAccount')}{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); setMessage(null); }}
                  className="text-primary font-medium hover:underline"
                >
                  {t('auth.register')}
                </button>
              </p>
            </>
          )}

          {mode === 'register' && (
            <p className="text-xs text-text-tertiary">
              {t('auth.hasAccount')}{' '}
              <button
                onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                className="text-primary font-medium hover:underline"
              >
                {t('auth.login')}
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => { setMode('login'); setError(null); setMessage(null); }}
              className="text-xs text-primary font-medium hover:underline"
            >
              {t('auth.login')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
