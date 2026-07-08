import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  checkRateLimitAsync,
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

const redisState = new Map<string, number>();
const redisExpiry = new Map<string, number>();

vi.mock('ioredis', () => {
  class MockRedis {
    private readonly url: string;
    private handlers: Record<string, Array<() => void>> = {};

    constructor(url: string) {
      this.url = url;
    }

    on(event: string, handler: () => void) {
      this.handlers[event] = this.handlers[event] || [];
      this.handlers[event].push(handler);
      return this;
    }

    async connect() {
      if (this.url.includes('unavailable')) {
        this.handlers.error?.forEach((handler) => handler());
        throw new Error('redis unavailable');
      }
    }

    async incr(key: string) {
      const now = Date.now();
      const exp = redisExpiry.get(key);
      if (exp && exp <= now) {
        redisState.delete(key);
        redisExpiry.delete(key);
      }
      const next = (redisState.get(key) ?? 0) + 1;
      redisState.set(key, next);
      return next;
    }

    async pexpire(key: string, ttlMs: number) {
      redisExpiry.set(key, Date.now() + ttlMs);
      return 1;
    }

    async quit() {
      return 'OK';
    }
  }

  return { default: MockRedis };
});

describe('titan-route-guard', () => {
  beforeEach(() => {
    resetTitanGuardState();
    redisState.clear();
    redisExpiry.clear();
    delete process.env.TITAN_RATELIMIT_REDIS_URL;
  });

  it('limits requests per key', () => {
    const key = 'titan:test-user';
    for (let i = 0; i < 30; i += 1) {
      expect(checkRateLimit(key, 30, 60_000)).toBe(true);
    }
    expect(checkRateLimit(key, 30, 60_000)).toBe(false);
  });

  it('uses redis rate limit when configured', async () => {
    process.env.TITAN_RATELIMIT_REDIS_URL = 'redis://fittrack-redis:6379';
    const key = 'titan:redis-user';
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(true);
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(true);
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(false);
  });

  it('falls back to memory rate limit when redis fails', async () => {
    process.env.TITAN_RATELIMIT_REDIS_URL = 'redis://unavailable:6379';
    const key = 'titan:fallback-user';
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(true);
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(true);
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(false);
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
