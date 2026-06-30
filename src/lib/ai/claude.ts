import { parseJsonObjectFromAI } from './parseJsonResponse';
import { supabase } from '../supabase';
import { CLAUDE_MODEL, ANTHROPIC_API_URL } from './model';

const STORAGE_KEY_LOCAL = 'cairn-ai-key';
const STORAGE_KEY_SESSION = 'cairn-ai-key-session';
const MODEL = CLAUDE_MODEL;
const MAX_TOKENS = 2048;
const API_URL = ANTHROPIC_API_URL;

export class AIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AIError';
    this.status = status;
  }
}

// Migrate existing key from old storage key to session (browser only)
if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
  (function migrateApiKey() {
    const legacy = localStorage.getItem('cairn-ai-key');
    if (legacy && !sessionStorage.getItem(STORAGE_KEY_SESSION)) {
      sessionStorage.setItem(STORAGE_KEY_SESSION, legacy);
    }
  })();
}

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

const CONNECT_TIMEOUT_MS = 30_000;

/**
 * Combines an optional caller abort signal with an internal connection timeout,
 * so a stalled request fails with a clear error instead of hanging forever.
 * `timedOut()` lets the caller tell a timeout apart from a user-initiated abort.
 */
function withConnectTimeout(signal: AbortSignal | undefined, ms: number) {
  const controller = new AbortController();
  let didTimeout = false;
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  const id = setTimeout(() => { didTimeout = true; controller.abort(); }, ms);
  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    clear: () => { clearTimeout(id); if (signal) signal.removeEventListener('abort', onAbort); },
  };
}

export async function* streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey?: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  let response: Response;
  const timeout = withConnectTimeout(signal, CONNECT_TIMEOUT_MS);

  try {
    if (supabase && !apiKey) {
      // Resolve the session, racing the timeout in case a stale/corrupt stored
      // session makes getSession() hang.
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new AIError('Request timed out', 408)), CONNECT_TIMEOUT_MS),
        ),
      ]);
      const session = sessionResult.data.session;
      if (!session) throw new AIError('Not authenticated', 401);

      response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ messages, systemPrompt }),
          signal: timeout.signal,
        }
      );
    } else if (apiKey) {
      response = await fetch(API_URL, {
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
        signal: timeout.signal,
      });
    } else {
      throw new AIError('No API key and no Supabase session', 401);
    }
  } catch (err) {
    // A timeout aborts the fetch as an AbortError — surface it as a clear 408.
    if (timeout.timedOut()) throw new AIError('Request timed out', 408);
    throw err;
  } finally {
    timeout.clear();
  }

  const res = response;

  if (!res.ok) {
    throw new AIError(
      `AI request failed: ${res.status}`,
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
          if (import.meta.env.DEV && data !== '[DONE]') {
            console.warn('[streamChatResponse] Unexpected non-JSON SSE line:', data, parseErr);
          }
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
  apiKey?: string,
): Promise<Record<string, unknown>> {
  const messages = [
    {
      role: 'user' as const,
      content: `Kontekst:\n${context}\n\nBrukerens beskrivelse (${tabType === 'initiative' ? 'aktivitet' : 'kapabilitet'}):\n${description}`,
    },
  ];

  let aiText: string;

  if (supabase && !apiKey) {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new AIError('Not authenticated', 401);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-form-suggest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages, systemPrompt }),
      }
    );

    if (!response.ok) throw new AIError(`AI request failed: ${response.status}`, response.status);
    const data = await response.json();
    aiText = data.text;
  } else if (apiKey) {
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
      }),
    });

    if (!res.ok) {
      throw new AIError(`AI request failed: ${res.status}`, res.status);
    }

    const json = await res.json();
    aiText = json.content?.[0]?.text || '';
  } else {
    throw new AIError('No API key and no Supabase session', 401);
  }

  return parseJsonObjectFromAI(aiText);
}
