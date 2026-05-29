import type { AuthSession, AuthUser } from '@/lib/auth/auth-types';

const USER_KEY = 'user';
const TOKEN_KEY = 'access_token';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredSession(): AuthSession | null {
  const user = getStoredUser();
  const accessToken = getAccessToken();
  if (!user || !accessToken) return null;
  return { user, accessToken };
}

export function setStoredSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  localStorage.setItem(TOKEN_KEY, session.accessToken);
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
