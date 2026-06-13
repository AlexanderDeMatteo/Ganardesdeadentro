import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { httpRequest } from '@/lib/api/http-client';
import * as unauthorizedHandler from '@/lib/api/unauthorized-handler';

vi.mock('@/lib/api/unauthorized-handler', () => ({
  handleUnauthorizedResponse: vi.fn(),
  resetUnauthorizedHandlerForTests: vi.fn(),
}));

describe('http-client 401 interceptor', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'Token inválido' }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('invokes handleUnauthorizedResponse on 401 when auth is enabled', async () => {
    await expect(httpRequest('/api/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(unauthorizedHandler.handleUnauthorizedResponse).toHaveBeenCalledOnce();
  });

  it('does not invoke handleUnauthorizedResponse on 401 when auth is disabled', async () => {
    await expect(
      httpRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'a@b.com', password: 'x' },
        auth: false,
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(unauthorizedHandler.handleUnauthorizedResponse).not.toHaveBeenCalled();
  });

  it('does not invoke handleUnauthorizedResponse on non-401 errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ error: 'Forbidden' }),
    } as Response);

    await expect(httpRequest('/api/admin/overview')).rejects.toBeInstanceOf(ApiError);
    expect(unauthorizedHandler.handleUnauthorizedResponse).not.toHaveBeenCalled();
  });
});
