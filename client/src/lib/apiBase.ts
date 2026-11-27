const rawEnvApi = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');

export const API_BASE =
  rawEnvApi.startsWith('http://') || rawEnvApi.startsWith('https://')
    ? rawEnvApi.endsWith('/api')
      ? rawEnvApi
      : `${rawEnvApi}/api`
    : rawEnvApi || '/api';

/**
 * Resolves relative `/api/...` paths against `VITE_API_URL` when configured.
 */
export function resolveApiUrl(path: string): string {
  if (!path) return API_BASE;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return `${API_BASE}${path.slice(4)}`;
  if (path === '/api') return API_BASE;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(resolveApiUrl(input), init);
}

