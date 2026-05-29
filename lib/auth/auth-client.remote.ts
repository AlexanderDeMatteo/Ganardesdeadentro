import type { LoginResponse, MeResponse, RegisterResponse } from '@/lib/api/contracts/auth';
import { httpRequest } from '@/lib/api/http-client';
import type {
  AuthClient,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from '@/lib/auth/auth-types';
import { AuthError } from '@/lib/auth/auth-types';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '@/lib/auth/session-store';

function mapApiUser(user: {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role: AuthUser['role'];
}): AuthUser {
  return {
    id: String(user.id),
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
  };
}

function toSession(response: LoginResponse | RegisterResponse): AuthSession {
  return {
    user: mapApiUser(response.user),
    accessToken: response.access_token,
  };
}

export const remoteAuthClient: AuthClient = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      const response = await httpRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials,
        auth: false,
      });
      const session = toSession(response);
      setStoredSession(session);
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      throw new AuthError(message);
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const { email, password, first_name, last_name } = credentials;
    try {
      const response = await httpRequest<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: { email, password, first_name, last_name },
        auth: false,
      });
      const session = toSession(response);
      setStoredSession(session);
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de registro';
      throw new AuthError(message);
    }
  },

  async logout(): Promise<void> {
    try {
      await httpRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Limpiar sesión local aunque falle el backend
    } finally {
      clearStoredSession();
    }
  },

  async refreshSession(): Promise<AuthSession | null> {
    const existing = getStoredSession();
    if (!existing) return null;
    try {
      const response = await httpRequest<MeResponse>('/api/auth/me');
      const session: AuthSession = {
        user: mapApiUser(response.user),
        accessToken: existing.accessToken,
      };
      setStoredSession(session);
      return session;
    } catch {
      clearStoredSession();
      return null;
    }
  },
};
