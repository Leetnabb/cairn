import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiKey, getFormSuggestion, AIError } from '../../lib/ai/claude';
import { supabase } from '../../lib/supabase';
import { buildFormSuggestionPrompt } from '../../lib/ai/prompts';
import { useStore } from '../../stores/useStore';

interface Props {
  tabType: 'initiative' | 'capability';
  onSuggestion: (data: Record<string, unknown>) => void;
}

export default function AIFormAssist({ tabType, onSuggestion }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    const apiKey = getApiKey() ?? undefined;
    if (!apiKey && !supabase) {
      setError(t('ai.ui.noKeyError'));
      return;
    }
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Build context from current state
      const state = useStore.getState();
      const scenario = state.scenarioStates[state.activeScenario];
      const initiatives = scenario?.initiatives || [];
      const caps = state.capabilities;

      const contextLines: string[] = [];
      contextLines.push(t('ai.contextCapabilities') + ': ' + caps.map(c => `${c.name} (L${c.level})`).join(', '));
      contextLines.push(t('ai.contextActivities') + ': ' + initiatives.map(i => i.name).join(', '));
      if (state.valueChains.length > 0) {
        contextLines.push(t('ai.contextValueChains') + ': ' + state.valueChains.map(vc => vc.name).join(', '));
      }
      const context = contextLines.join('\n');

      const systemPrompt = buildFormSuggestionPrompt(tabType);
      const result = await getFormSuggestion(text, context, tabType, systemPrompt, apiKey ?? undefined);
      onSuggestion(result);
    } catch (err) {
      if (err instanceof AIError) {
        if (err.status === 401) setError(t('ai.ui.invalidKey'));
        else if (err.status === 429) setError(t('ai.ui.tooManyRequests'));
        else setError(t('ai.ui.couldNotFetch'));
      } else {
        setError(t('ai.ui.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3 p-2.5 bg-primary/5 rounded border border-primary/10">
      <div className="flex items-center gap-1.5 mb-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
          <path d="M12 2a4 4 0 014 4c0 1.1-.9 2-2 2h-4a2 2 0 01-2-2 4 4 0 014-4zM8 8v2a6 6 0 0012 0V8M6 12a8 8 0 0012 0M9 20h6M12 16v4" />
        </svg>
        <span className="text-[10px] font-medium text-primary">{t('ai.ui.suggestion')}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          tabType === 'initiative'
            ? t('ai.ui.initiativePlaceholder')
            : t('ai.ui.capabilityPlaceholder')
        }
        rows={2}
        className="w-full px-2 py-1.5 text-[10px] border border-border rounded resize-none bg-white focus:outline-none focus:border-primary"
      />
      <div className="flex items-center justify-between mt-1.5">
        <button
          onClick={handleSuggest}
          disabled={loading || !text.trim()}
          className="px-3 py-1 text-[10px] bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? t('ai.ui.thinking') : t('ai.ui.suggest')}
        </button>
        {error && (
          <span className="text-[9px] text-red-600">{error}</span>
        )}
      </div>
    </div>
  );
}
