import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIStore } from '../../stores/useAIStore';
import { useStore } from '../../stores/useStore';
import { useAIChat } from '../../hooks/useAIChat';
import { parseSuggestions, type AISuggestion } from '../../lib/ai/parseSuggestions';
import type { DimensionKey, Horizon } from '../../types';
import APIKeyInput from './APIKeyInput';
import { EmptyState } from '../ui/EmptyState';

function SuggestionCard({ suggestion }: { suggestion: AISuggestion }) {
  const { t } = useTranslation();
  const addInitiative = useStore((s) => s.addInitiative);
  const addCapability = useStore((s) => s.addCapability);
  const updateInitiative = useStore((s) => s.updateInitiative);
  const updateCapability = useStore((s) => s.updateCapability);
  const deleteInitiative = useStore((s) => s.deleteInitiative);
  const deleteCapability = useStore((s) => s.deleteCapability);
  const capabilities = useStore((s) => s.capabilities);
  const activeScenario = useStore((s) => s.activeScenario);
  const scenarioStates = useStore((s) => s.scenarioStates);
  const [applied, setApplied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const action = suggestion.action || 'create';

  const findTarget = () => {
    const initiatives = scenarioStates[activeScenario]?.initiatives || [];
    if (suggestion.type === 'initiative') {
      return initiatives.find(
        (i) => i.name.toLowerCase() === suggestion.targetName?.toLowerCase()
      );
    } else {
      return capabilities.find(
        (c) => c.name.toLowerCase() === suggestion.targetName?.toLowerCase()
      );
    }
  };

  const handleAdd = () => {
    if (applied) return;

    if (suggestion.type === 'initiative') {
      const initiatives = scenarioStates[activeScenario]?.initiatives || [];
      const dim = (suggestion.dimension || 'ledelse') as DimensionKey;
      const hor = (suggestion.horizon === 'far' ? 'far' : 'near') as Horizon;
      const maxOrder = initiatives
        .filter((i) => i.dimension === dim && i.horizon === hor)
        .reduce((max, i) => Math.max(max, i.order), 0);

      const capIds = (suggestion.suggestedCapabilities || [])
        .map((name) => {
          const cap = capabilities.find(
            (c) => c.name.toLowerCase() === name.toLowerCase()
          );
          return cap?.id;
        })
        .filter((id): id is string => !!id);

      addInitiative({
        id: `i_${Date.now()}`,
        name: suggestion.name,
        description: suggestion.description || '',
        dimension: dim,
        horizon: hor,
        order: maxOrder + 1,
        capabilities: capIds,
        owner: suggestion.owner || '',
        dependsOn: [],
        maturityEffect: {},
        notes: suggestion.notes || '',
        valueChains: [],
      });
    } else {
      let parentId: string | null = null;
      if (suggestion.suggestedParent && suggestion.level === 2) {
        const parent = capabilities.find(
          (c) =>
            c.level === 1 &&
            c.name.toLowerCase() === suggestion.suggestedParent!.toLowerCase()
        );
        parentId = parent?.id || null;
      }

      addCapability({
        id: `c_${Date.now()}`,
        name: suggestion.name,
        description: suggestion.description || '',
        level: (suggestion.level === 1 ? 1 : 2) as 1 | 2,
        parent: parentId,
        maturity: ([1, 2, 3].includes(suggestion.maturity!) ? suggestion.maturity! : 1) as 1 | 2 | 3,
        risk: ([1, 2, 3].includes(suggestion.risk!) ? suggestion.risk! : 1) as 1 | 2 | 3,
      });
    }

    setApplied(true);
  };

  const handleUpdate = () => {
    if (applied) return;
    const target = findTarget();
    if (!target) {
      setNotFound(true);
      return;
    }
    const updates = suggestion.updates || {};
    if (suggestion.type === 'initiative') {
      updateInitiative(target.id, updates);
    } else {
      updateCapability(target.id, updates);
    }
    setApplied(true);
  };

  const handleDelete = () => {
    if (applied) return;
    const target = findTarget();
    if (!target) {
      setNotFound(true);
      return;
    }
    if (!confirm(t('detail.confirmDelete', { name: suggestion.targetName }))) return;
    if (suggestion.type === 'initiative') {
      deleteInitiative(target.id);
    } else {
      deleteCapability(target.id);
    }
    setApplied(true);
  };

  if (action === 'update') {
    return (
      <div className="my-1.5 p-2 bg-card border border-orange-200 rounded shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-medium text-orange-600 uppercase tracking-wide">
            {t('ai.ui.update')} {suggestion.type === 'initiative' ? t('ai.ui.initiative') : t('ai.ui.capability')}
          </span>
          <button
            onClick={handleUpdate}
            disabled={applied || notFound}
            className={`px-2 py-0.5 text-[9px] rounded ${
              applied
                ? 'bg-green-100 text-green-700'
                : notFound
                ? 'bg-red-100 text-red-700'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {applied ? t('ai.ui.updated') : notFound ? t('ai.ui.notFound') : t('ai.ui.update')}
          </button>
        </div>
        <p className="text-[11px] font-medium text-text-primary">{suggestion.targetName}</p>
        {suggestion.updates && (
          <div className="mt-1 space-y-0.5">
            {Object.entries(suggestion.updates).map(([key, val]) => (
              <div key={key} className="text-[9px] text-text-secondary">
                <span className="font-medium">{key}:</span> {String(val)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (action === 'delete') {
    return (
      <div className="my-1.5 p-2 bg-card border border-red-200 rounded shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-medium text-red-600 uppercase tracking-wide">
            {t('ai.ui.deleteItem')} {suggestion.type === 'initiative' ? t('ai.ui.initiative') : t('ai.ui.capability')}
          </span>
          <button
            onClick={handleDelete}
            disabled={applied || notFound}
            className={`px-2 py-0.5 text-[9px] rounded ${
              applied
                ? 'bg-green-100 text-green-700'
                : notFound
                ? 'bg-red-100 text-red-700'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {applied ? t('ai.ui.deleted') : notFound ? t('ai.ui.notFound') : t('common.delete')}
          </button>
        </div>
        <p className="text-[11px] font-medium text-text-primary">{suggestion.targetName}</p>
      </div>
    );
  }

  // Default: create
  return (
    <div className="my-1.5 p-2 bg-card border border-border rounded shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-medium text-primary uppercase tracking-wide">
          {suggestion.type === 'initiative' ? t('ai.ui.initiative') : t('ai.ui.capability')}
        </span>
        <button
          onClick={handleAdd}
          disabled={applied}
          className={`px-2 py-0.5 text-[9px] rounded ${
            applied
              ? 'bg-green-100 text-green-700'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {applied ? t('ai.ui.added') : t('ai.ui.addItem')}
        </button>
      </div>
      <p className="text-[11px] font-medium text-text-primary">{suggestion.name}</p>
      {suggestion.description && (
        <p className="text-[10px] text-text-secondary mt-0.5">{suggestion.description}</p>
      )}
      {suggestion.dimension && (
        <span className="inline-block mt-1 mr-1 px-1 py-0.5 text-[8px] bg-[var(--bg-hover)] rounded text-text-tertiary">
          {suggestion.dimension}
        </span>
      )}
      {suggestion.horizon && (
        <span className="inline-block mt-1 mr-1 px-1 py-0.5 text-[8px] bg-[var(--bg-hover)] rounded text-text-tertiary">
          {t(`labels.horizon.${suggestion.horizon}`)}
        </span>
      )}
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const suggestions = parseSuggestions(content);
  const cleanText = content.replace(/```json:suggestion\s*\n[\s\S]*?```/g, '').trim();

  return (
    <>
      {cleanText && (
        <p className="text-[11px] whitespace-pre-wrap">{cleanText}</p>
      )}
      {suggestions.map((s, i) => (
        <SuggestionCard key={i} suggestion={s} />
      ))}
    </>
  );
}

export default function AIChatPanel() {
  const { t } = useTranslation();
  const messages = useAIStore((s) => s.messages);
  const isStreaming = useAIStore((s) => s.isStreaming);
  const streamingText = useAIStore((s) => s.streamingText);
  const error = useAIStore((s) => s.error);
  const apiKeyConfigured = useAIStore((s) => s.apiKeyConfigured);
  const showApiKeyInput = useAIStore((s) => s.showApiKeyInput);
  const clearMessages = useAIStore((s) => s.clearMessages);
  const setShowApiKeyInput = useAIStore((s) => s.setShowApiKeyInput);

  const { sendMessage, stopStreaming } = useAIChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <h2 className="text-[12px] font-semibold text-text-primary">{t('ai.ui.title')}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-1 text-[10px] text-text-tertiary hover:text-text-secondary"
            title={t('ai.ui.clearChat')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
            </svg>
          </button>
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="p-1 text-[10px] text-text-tertiary hover:text-text-secondary"
            title={t('ai.ui.settings')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </div>

      {(!apiKeyConfigured || showApiKeyInput) && <APIKeyInput />}

      {error && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-[10px] text-red-700">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && !isStreaming && (
          <EmptyState
            icon="cairn"
            title={t('ai.ui.askHelp')}
            body={t('ai.ui.askExample')}
          />
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-2.5 py-1.5 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-[var(--bg-hover)] text-text-primary'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-[11px] whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <MessageContent content={msg.content} />
              )}
            </div>
          </div>
        ))}

        {isStreaming && streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-2.5 py-1.5 rounded-lg bg-[var(--bg-hover)] text-text-primary">
              <MessageContent content={streamingText} />
            </div>
          </div>
        )}

        {isStreaming && !streamingText && (
          <div className="flex justify-start">
            <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-hover)]">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-2">
        {isStreaming ? (
          <button
            onClick={stopStreaming}
            className="w-full py-1.5 text-[10px] text-red-600 border border-red-200 rounded hover:bg-red-50"
          >
            {t('ai.ui.stopGeneration')}
          </button>
        ) : (
          <div className="flex gap-1.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai.ui.inputPlaceholder')}
              rows={2}
              className="flex-1 px-2 py-1.5 text-[11px] border border-border rounded resize-none focus:outline-none focus:border-primary bg-card"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="self-end px-3 py-1.5 text-[10px] bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
            >
              {t('common.send')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
