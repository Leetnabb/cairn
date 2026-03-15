import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setApiKey, getApiKey, removeApiKey, isApiKeyPersisted } from '../../lib/ai/claude';
import { useAIStore } from '../../stores/useAIStore';

export default function APIKeyInput() {
  const { t } = useTranslation();
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [persist, setPersist] = useState(isApiKeyPersisted());
  const hasKey = useAIStore((s) => s.apiKeyConfigured);
  const setApiKeyConfigured = useAIStore((s) => s.setApiKeyConfigured);
  const setShowApiKeyInput = useAIStore((s) => s.setShowApiKeyInput);

  const handleSave = () => {
    if (!key.trim()) return;
    setApiKey(key.trim(), persist);
    setApiKeyConfigured(true);
    setKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemove = () => {
    removeApiKey();
    setApiKeyConfigured(false);
    setKey('');
  };

  return (
    <div className="p-3 bg-primary/5 border-b border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-text-secondary">
          {t('ai.ui.apiKeyLabel')}
        </span>
        {hasKey && (
          <button
            onClick={() => setShowApiKeyInput(false)}
            className="text-[9px] text-text-tertiary hover:text-text-secondary"
          >
            {t('common.close')}
          </button>
        )}
      </div>
      {hasKey && !saved ? (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-green-600">{t('ai.ui.keyConfigured')}</span>
          <button
            onClick={handleRemove}
            className="text-[9px] text-red-500 hover:text-red-700"
          >
            {t('common.remove')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-1.5">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={getApiKey() ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : 'sk-ant-...'}
              className="flex-1 px-2 py-1 text-[10px] border border-border rounded bg-white focus:outline-none focus:border-primary"
              aria-label={t('ai.ui.apiKeyLabel')}
            />
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className="px-2 py-1 text-[10px] bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
          <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={persist}
              onChange={e => setPersist(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-[9px] text-text-tertiary">{t('ai.ui.persistKey')}</span>
          </label>
        </>
      )}
      {saved && (
        <p className="mt-1 text-[9px] text-green-600">{t('ai.ui.keySaved')}</p>
      )}
    </div>
  );
}
