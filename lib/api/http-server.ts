import { getServerApiBaseUrl } from '@/lib/api/config';

export type ServerHttpResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error?: string };

export async function serverHttpRequest<T>(
  path: string,
  token: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ServerHttpResult<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${getServerApiBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error: unknown }).error === 'string'
          ? (payload as { error: string }).error
          : undefined;
      return { ok: false, status: response.status, error: message };
    }

    return { ok: true, data: payload as T };
  } catch {
    return { ok: false, status: 503, error: 'Servicio no disponible' };
  }
}
