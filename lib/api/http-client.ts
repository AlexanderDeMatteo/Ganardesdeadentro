import { getApiBaseUrl } from '@/lib/api/config';
import { ApiError } from '@/lib/api/errors';
import { handleUnauthorizedResponse } from '@/lib/api/unauthorized-handler';
import { getAccessToken } from '@/lib/auth/session-store';

export interface HttpRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown | FormData;
  auth?: boolean;
}

export async function httpRequest<T>(
  path: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers: initHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(initHeaders as Record<string, string>),
  };

  if (body !== undefined) {
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
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
        : `Error HTTP ${response.status}`;
    if (response.status === 401 && auth) {
      handleUnauthorizedResponse();
    }
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function checkApiHealth(): Promise<{ status: string }> {
  return httpRequest<{ status: string }>('/api/health', { auth: false });
}
