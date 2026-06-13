import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleUnauthorizedResponse,
  resetUnauthorizedHandlerForTests,
} from '@/lib/api/unauthorized-handler';
import * as sessionStore from '@/lib/auth/session-store';

vi.mock('@/lib/auth/session-store', () => ({
  clearStoredSession: vi.fn(),
}));

describe('unauthorized-handler', () => {
  beforeEach(() => {
    resetUnauthorizedHandlerForTests();
    vi.stubGlobal('window', {
      location: {
        pathname: '/dashboard',
        assign: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('clears session and redirects to login from protected pages', () => {
    handleUnauthorizedResponse();
    expect(sessionStore.clearStoredSession).toHaveBeenCalledOnce();
    expect(window.location.assign).toHaveBeenCalledWith('/login');
  });

  it('clears session without redirect loop on login page (E3c)', () => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/login',
        assign: vi.fn(),
      },
    });

    handleUnauthorizedResponse();
    expect(sessionStore.clearStoredSession).toHaveBeenCalledOnce();
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
