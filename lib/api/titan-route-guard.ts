import { NextResponse } from 'next/server';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

const DEFAULT_MAX_REQUESTS = 30;
const DEFAULT_WINDOW_MS = 60_000;

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
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
    { status: 429 },
  );
}

/**
 * Mientras la auth real no esté integrada, exige presencia de token mock
 * enviado por el cliente (localStorage). Punto de enganche para JWT real.
 */
export function requireMockSession(request: Request): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token.startsWith('mock_token_') || token.length < 12) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  return null;
}

import { isTitanNutritionTier } from '@/lib/auth/titan';

/**
 * Gating de servidor para asistente nutricional Titan.
 * Valida tier declarado en body; reemplazar por JWT/claims cuando exista auth real.
 */
export function requireTitanNutritionAccess(
  membershipTier: unknown,
  userRole: unknown,
): NextResponse | null {
  if (userRole === 'admin') {
    return null;
  }

  if (typeof membershipTier !== 'string' || !isTitanNutritionTier(membershipTier)) {
    return NextResponse.json(
      { error: 'Acceso restringido a membresías Premium o Pro' },
      { status: 403 },
    );
  }

  return null;
}

export function applyRouteGuard(request: Request): NextResponse | null {
  const clientKey = getClientKey(request);
  if (!checkRateLimit(`titan:${clientKey}`)) {
    return rateLimitResponse();
  }

  return requireMockSession(request);
}
