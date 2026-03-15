import { parseJsonObjectFromAI } from './parseJsonResponse';

const STORAGE_KEY_LOCAL = 'cairn-ai-key';
const STORAGE_KEY_SESSION = 'cairn-ai-key-session';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;
const API_URL = 'https://api.anthropic.com/v1/messages';

export class AIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AIError';
    this.status = status;
  }
}

// Migrate existing key from old storage key to session
(function migrateApiKey() {
  const legacy = localStorage.getItem('cairn-ai-key');
  if (legacy && !sessionStorage.getItem(STORAGE_KEY_SESSION)) {
    sessionStorage.setItem(STORAGE_KEY_SESSION, legacy);
  }
})();

/** Returns the API key from sessionStorage first, then localStorage (persisted). */
export function getApiKey(): string | null {
  return sessionStorage.getItem(STORAGE_KEY_SESSION)
    ?? localStorage.getItem(STORAGE_KEY_LOCAL);
}

/**
 * Saves the API key. By default stored only in sessionStorage (cleared on tab close).
 * Pass `persist: true` to also save in localStorage across sessions.
 */
export function setApiKey(key: string, persist = false): void {
  sessionStorage.setItem(STORAGE_KEY_SESSION, key);
  if (persist) {
    localStorage.setItem(STORAGE_KEY_LOCAL, key);
  } else {
    localStorage.removeItem(STORAGE_KEY_LOCAL);
  }
}

export function removeApiKey(): void {
  sessionStorage.removeItem(STORAGE_KEY_SESSION);
  localStorage.removeItem(STORAGE_KEY_LOCAL);
}

/** Returns true if the key is persisted to localStorage across sessions. */
export function isApiKeyPersisted(): boolean {
  return !!localStorage.getItem(STORAGE_KEY_LOCAL);
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function* streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    throw new AIError(
      `API error: ${res.status}`,
      res.status
    );
  }

  if (!res.body) throw new AIError('Response body is empty', 0);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.text) {
            yield event.delta.text;
          }
        } catch (parseErr) {
          // Skip non-JSON lines (expected for SSE metadata)
          if (data !== '[DONE]') console.warn('Unexpected non-JSON SSE line:', data, parseErr);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function getFormSuggestion(
  description: string,
  context: string,
  tabType: 'initiative' | 'capability',
  systemPrompt: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Kontekst:\n${context}\n\nBrukerens beskrivelse (${tabType === 'initiative' ? 'aktivitet' : 'kapabilitet'}):\n${description}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new AIError(`API error: ${res.status}`, res.status);
  }

  const json = await res.json();
  const text: string = json.content?.[0]?.text || '';
  return parseJsonObjectFromAI(text);
}
