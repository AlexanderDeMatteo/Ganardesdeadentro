import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  requireTitanNutritionAccess,
  requireTitanMotivationAccess,
  resetTitanGuardState,
  verifyTitanSession,
  type VerifiedTitanSession,
} from '@/lib/api/titan-route-guard';

vi.mock('@/lib/api/config', () => ({
  isApiAuthSource: vi.fn(() => true),
}));

vi.mock('@/lib/api/http-server', () => ({
  serverHttpRequest: vi.fn(),
}));

import { serverHttpRequest } from '@/lib/api/http-server';

describe('titan-route-guard', () => {
  beforeEach(() => {
    resetTitanGuardState();
  });

  it('limits requests per key', () => {
    const key = 'titan:test-user';
    for (let i = 0; i < 30; i += 1) {
      expect(checkRateLimit(key, 30, 60_000)).toBe(true);
    }
    expect(checkRateLimit(key, 30, 60_000)).toBe(false);
  });

  it('allows Premium nutrition access for athletes', () => {
    const session: VerifiedTitanSession = {
      userId: '1',
      role: 'user',
      membershipName: 'Premium',
    };
    process.env.NEXT_PUBLIC_AUTH_SOURCE = 'api';
    expect(requireTitanNutritionAccess(session)).toBeNull();
  });

  it('denies Basic nutrition access for athletes in api mode', () => {
    const session: VerifiedTitanSession = {
      userId: '1',
      role: 'user',
      membershipName: 'Básica',
    };
    process.env.NEXT_PUBLIC_AUTH_SOURCE = 'api';
    const response = requireTitanNutritionAccess(session);
    expect(response?.status).toBe(403);
  });

  it('allows admin nutrition access without membership', () => {
    const session: VerifiedTitanSession = {
      userId: '2',
      role: 'admin',
    };
    process.env.NEXT_PUBLIC_AUTH_SOURCE = 'api';
    expect(requireTitanNutritionAccess(session)).toBeNull();
  });

  it('allows motivation for trainer role', () => {
    const session: VerifiedTitanSession = {
      userId: '3',
      role: 'trainer',
    };
    expect(requireTitanMotivationAccess(session)).toBeNull();
  });

  it('denies motivation for unknown role', () => {
    const session: VerifiedTitanSession = {
      userId: '4',
      role: 'guest' as VerifiedTitanSession['role'],
    };
    const response = requireTitanMotivationAccess(session);
    expect(response?.status).toBe(403);
  });

  it('returns 401 when auth/me rejects invalid token', async () => {
    vi.mocked(serverHttpRequest).mockResolvedValue({
      ok: false,
      status: 422,
      error: 'Invalid token',
    });

    const request = new Request('http://localhost/api/coach/titan', {
      headers: { Authorization: 'Bearer invalid-token-qa' },
    });
    const response = await verifyTitanSession(request);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
  });

  it('returns 503 when auth service is unavailable', async () => {
    vi.mocked(serverHttpRequest).mockResolvedValue({
      ok: false,
      status: 503,
      error: 'Servicio no disponible',
    });

    const request = new Request('http://localhost/api/coach/titan', {
      headers: { Authorization: 'Bearer some-token' },
    });
    const response = await verifyTitanSession(request);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(503);
  });

  it('returns 401 when bearer token is missing', async () => {
    const request = new Request('http://localhost/api/coach/titan');
    const response = await verifyTitanSession(request);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
  });
});
