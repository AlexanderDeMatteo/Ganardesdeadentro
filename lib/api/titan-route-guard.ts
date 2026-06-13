import { NextResponse } from 'next/server';
import type { MeResponse } from '@/lib/api/contracts/auth';
import { isApiAuthSource } from '@/lib/api/config';
import { serverHttpRequest } from '@/lib/api/http-server';
import {
  hasTitanMotivationAccessForRole,
  isTitanNutritionTier,
  type TitanMembershipName,
} from '@/lib/auth/titan';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, RateLimitBucket>();

const DEFAULT_MAX_REQUESTS = Number(process.env.TITAN_RATELIMIT_MAX_REQUESTS ?? 30);
const DEFAULT_WINDOW_MS = Number(process.env.TITAN_RATELIMIT_WINDOW_MS ?? 60_000);
const SESSION_CACHE_TTL_MS = 30_000;

export type VerifiedTitanSession = {
  userId: string;
  role: 'user' | 'admin' | 'trainer';
  membershipName?: TitanMembershipName;
};

type SessionCacheEntry = {
  session: VerifiedTitanSession;
  expiresAt: number;
};

const sessionCache = new Map<string, SessionCacheEntry>();

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'local';
}

export function checkRateLimit(
  key: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): boolean {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export async function checkRateLimitAsync(
  key: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): Promise<boolean> {
  // Map en proceso por userId. Redis distribuido (TITAN_RATELIMIT_REDIS_URL) → Fase 7.
  return checkRateLimit(key, maxRequests, windowMs);
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
    { status: 429 },
  );
}

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function mapMeToSession(data: MeResponse): VerifiedTitanSession {
  const membershipName = data.membership?.name;
  return {
    userId: String(data.user.id),
    role: data.user.role,
    membershipName:
      membershipName === 'Básica' ||
      membershipName === 'Premium' ||
      membershipName === 'Pro'
        ? membershipName
        : undefined,
  };
}

export async function verifyTitanSession(
  request: Request,
): Promise<VerifiedTitanSession | NextResponse> {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });
  }

  if (!isApiAuthSource()) {
    if (!token.startsWith('mock_token_') || token.length < 12) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }
    return {
      userId: `mock:${token.slice(-12)}`,
      role: 'user',
    };
  }

  const cached = sessionCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.session;
  }

  const result = await serverHttpRequest<MeResponse>('/api/auth/me', token);
  if (!result.ok) {
    if (result.status === 503 || result.status === 502 || result.status === 504) {
      return NextResponse.json(
        { error: 'Servicio de autenticación no disponible' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const session = mapMeToSession(result.data);
  sessionCache.set(token, { session, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
  return session;
}

/** @deprecated Use verifyTitanSession */
export function requireSession(request: Request): NextResponse | null {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });
  }

  if (isApiAuthSource()) {
    return null;
  }

  if (!token.startsWith('mock_token_') || token.length < 12) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  return null;
}

/** @deprecated Use verifyTitanSession */
export function requireMockSession(request: Request): NextResponse | null {
  return requireSession(request);
}

export function requireTitanNutritionAccess(
  session: VerifiedTitanSession,
): NextResponse | null {
  if (!isApiAuthSource()) {
    return null;
  }

  if (session.role === 'admin') {
    return null;
  }

  if (session.membershipName && isTitanNutritionTier(session.membershipName)) {
    return null;
  }

  return NextResponse.json(
    { error: 'Acceso restringido a membresías Premium o Pro' },
    { status: 403 },
  );
}

export function requireTitanMotivationAccess(
  session: VerifiedTitanSession,
): NextResponse | null {
  if (!hasTitanMotivationAccessForRole(session.role)) {
    return NextResponse.json({ error: 'Acceso no permitido' }, { status: 403 });
  }
  return null;
}

export async function applyRouteGuard(
  request: Request,
): Promise<VerifiedTitanSession | NextResponse> {
  const sessionOrError = await verifyTitanSession(request);
  if (isNextResponse(sessionOrError)) {
    return sessionOrError;
  }

  const rateLimitKey = `titan:${sessionOrError.userId}`;
  const allowed = await checkRateLimitAsync(rateLimitKey);
  if (!allowed) {
    return rateLimitResponse();
  }

  return sessionOrError;
}

/** Limpia caches en tests. */
export function resetTitanGuardState(): void {
  memoryBuckets.clear();
  sessionCache.clear();
}
