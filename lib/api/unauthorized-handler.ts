import { clearStoredSession } from '@/lib/auth/session-store';

const LOGIN_PATH = '/login';

let handlingUnauthorized = false;

export function handleUnauthorizedResponse(): void {
  if (typeof window === 'undefined') return;
  if (handlingUnauthorized) return;

  clearStoredSession();

  const path = window.location.pathname;
  if (path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}/`)) {
    return;
  }

  handlingUnauthorized = true;
  window.location.assign(LOGIN_PATH);
}

/** Solo para tests. */
export function resetUnauthorizedHandlerForTests(): void {
  handlingUnauthorized = false;
}
