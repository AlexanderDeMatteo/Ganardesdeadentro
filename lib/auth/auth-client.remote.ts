import type {
  AcceptInviteResponse,
  InviteValidationResponse,
  LoginResponse,
  MeResponse,
  RegisterResponse,
} from '@/lib/api/contracts/auth';
import { httpRequest } from '@/lib/api/http-client';
import type {
  AuthClient,
  AuthSession,
  AuthUser,
  LoginCredentials,
  Membership,
  RegisterCredentials,
} from '@/lib/auth/auth-types';
import { AuthError } from '@/lib/auth/auth-types';
import { mapMeMembership } from '@/lib/auth/map-me-membership';
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
  const id = String(user.id);
  return {
    id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    ...(user.role === 'trainer' ? { trainer_id: id } : {}),
  };
}

function toSession(
  response: LoginResponse | RegisterResponse,
  membership?: Membership,
): AuthSession {
  const user = mapApiUser(response.user);
  return {
    user: membership ? { ...user, membership } : user,
    accessToken: response.access_token,
  };
}

function toSessionFromMe(response: MeResponse, accessToken: string): AuthSession {
  const membership = mapMeMembership(response.membership);
  const user = mapApiUser(response.user);
  return {
    user: membership ? { ...user, membership } : user,
    accessToken,
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
      const refreshed = await this.refreshSession();
      return refreshed ?? session;
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
      const refreshed = await this.refreshSession();
      return refreshed ?? session;
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
      const session = toSessionFromMe(response, existing.accessToken);
      setStoredSession(session);
      return session;
    } catch {
      clearStoredSession();
      return null;
    }
  },

  async validateInviteToken(token: string) {
    return httpRequest<InviteValidationResponse>(
      `/api/auth/invite/${encodeURIComponent(token)}`,
      { auth: false },
    );
  },

  async acceptInvite(token: string, password: string) {
    await httpRequest<AcceptInviteResponse>('/api/auth/accept-invite', {
      method: 'POST',
      body: { token, password },
      auth: false,
    });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await httpRequest('/api/auth/change-password', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword },
    });
  },

  async updateProfile(patch: { first_name?: string; last_name?: string }): Promise<void> {
    await httpRequest('/api/users/me', {
      method: 'PATCH',
      body: patch,
    });
  },
};
