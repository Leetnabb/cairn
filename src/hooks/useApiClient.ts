/**
 * Minimal API client hook.
 * Attaches the Supabase JWT (stored in localStorage under 'cairn_access_token')
 * to all requests. In local (non-auth) mode, requests are no-ops or return
 * gracefully — the Settings UI degrades cleanly when no server is configured.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function getToken(): string {
  return localStorage.getItem('cairn_access_token') ?? '';
}

function buildHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`;
  const response = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as unknown as T;
  return response.json() as Promise<T>;
}

export function useApiClient() {
  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
    delete: (path: string) => request<void>('DELETE', path),
  };
}
