import { useRef, useCallback } from 'react';
import { useAIStore } from '../stores/useAIStore';
import { useStore } from '../stores/useStore';
import { getApiKey, streamChatResponse, AIError } from '../lib/ai/claude';
import { buildChatSystemPrompt } from '../lib/ai/prompts';
import i18n from '../i18n';

const MAX_MESSAGES = 20;

/** Builds the system prompt context from current app state. Pure function – no hooks. */
function buildChatContext(): string {
  const appState = useStore.getState();
  return buildChatSystemPrompt({
    capabilities: appState.capabilities,
    scenarios: appState.scenarios,
    scenarioStates: appState.scenarioStates,
    activeScenario: appState.activeScenario,
    milestones: appState.milestones,
    valueChains: appState.valueChains,
    effects: appState.effects,
    comments: appState.comments,
    snapshots: [],
  });
}

function getErrorMessage(err: unknown): string {
  if (err instanceof AIError) {
    if (err.status === 401) return i18n.t('ai.errors.invalidKey');
    if (err.status === 429) return i18n.t('ai.errors.tooMany');
    if (err.status >= 500) return i18n.t('ai.errors.serverError');
  }
  if (err instanceof TypeError && err.message?.includes('fetch')) {
    return i18n.t('ai.errors.networkError');
  }
  return i18n.t('ai.errors.networkError');
}

export function useAIChat() {
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      useAIStore.getState().setError(i18n.t('ai.ui.noKeyConfigured'));
      useAIStore.getState().setShowApiKeyInput(true);
      return;
    }

    const store = useAIStore.getState();
    if (store.isStreaming) return;

    // Add user message
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: text,
    };
    store.addMessage(userMsg);
    store.setError(null);
    store.setStreaming(true);

    const systemPrompt = buildChatContext();

    // Build message history (last N messages)
    const allMessages = [...useAIStore.getState().messages];
    const recentMessages = allMessages.slice(-MAX_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      for await (const chunk of streamChatResponse(
        recentMessages,
        systemPrompt,
        apiKey,
        abort.signal
      )) {
        useAIStore.getState().appendStreamingText(chunk);
      }
      useAIStore.getState().finalizeStreaming();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        useAIStore.getState().finalizeStreaming();
      } else {
        useAIStore.getState().setStreaming(false);
        useAIStore.getState().setError(getErrorMessage(err));
      }
    } finally {
      abortRef.current = null;
    }
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, stopStreaming };
}
