import type {
  AuthClient,
  AuthSession,
  AuthUser,
  LoginCredentials,
  Membership,
  RegisterCredentials,
} from '@/lib/auth/auth-types';
import { AuthError } from '@/lib/auth/auth-types';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '@/lib/auth/session-store';

interface MockUserRecord {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: AuthUser['role'];
  trainer_id?: string;
  membership?: Membership;
}

const MOCK_USERS: Record<string, MockUserRecord> = {
  'test@example.com': {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Juan',
    last_name: 'Pérez',
    role: 'user',
    trainer_id: '1',
    membership: {
      id: '2',
      name: 'Premium',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysRemaining: 60,
      price: 29.99,
      features: ['Rutinas personalizadas', 'Seguimiento de métricas', 'Acceso a entrenador'],
    },
  },
  'admin@example.com': {
    id: '2',
    email: 'admin@example.com',
    password: 'password123',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
  },
  'trainer@example.com': {
    id: '3',
    email: 'trainer@example.com',
    password: 'password123',
    first_name: 'Diego',
    last_name: 'Rodríguez',
    role: 'trainer',
    trainer_id: '1',
  },
  'pro@example.com': {
    id: '4',
    email: 'pro@example.com',
    password: 'password123',
    first_name: 'Laura',
    last_name: 'Gómez',
    role: 'user',
    membership: {
      id: '3',
      name: 'Pro',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysRemaining: 90,
      price: 49.99,
      features: ['Coach Titan nutricional', 'Rutinas avanzadas', 'Seguimiento prioritario'],
    },
  },
  'basic@example.com': {
    id: '5',
    email: 'basic@example.com',
    password: 'password123',
    first_name: 'Mario',
    last_name: 'Ruiz',
    role: 'user',
    membership: {
      id: '1',
      name: 'Básica',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysRemaining: 23,
      price: 0,
      features: ['Registro manual de comidas', 'Resumen diario básico'],
    },
  },
};

function withMembershipDaysRemaining(membership: Membership): Membership {
  const today = new Date();
  const endDate = new Date(membership.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { ...membership, daysRemaining: Math.max(0, daysRemaining) };
}

function toAuthUser(record: MockUserRecord): AuthUser {
  const membership = record.membership
    ? withMembershipDaysRemaining(record.membership)
    : undefined;
  return {
    id: record.id,
    email: record.email,
    first_name: record.first_name,
    last_name: record.last_name,
    role: record.role,
    trainer_id: record.trainer_id,
    membership,
  };
}

const delay = () => new Promise<void>((r) => setTimeout(r, 800));

export const localAuthClient: AuthClient = {
  async login({ email, password }: LoginCredentials): Promise<AuthSession> {
    await delay();
    const mockUser = MOCK_USERS[email];
    if (!mockUser || mockUser.password !== password) {
      throw new AuthError('Invalid email or password');
    }
    const session: AuthSession = {
      user: toAuthUser(mockUser),
      accessToken: `mock_token_${Date.now()}`,
    };
    setStoredSession(session);
    return session;
  },

  async register({
    email,
    password,
    first_name,
    last_name,
  }: RegisterCredentials): Promise<AuthSession> {
    await delay();
    if (MOCK_USERS[email]) {
      throw new AuthError('Email already exists');
    }
    if (password.length < 8) {
      throw new AuthError('Password must be at least 8 characters');
    }
    const session: AuthSession = {
      user: {
        id: Date.now().toString(),
        email,
        first_name,
        last_name,
        role: 'user',
      },
      accessToken: `mock_token_${Date.now()}`,
    };
    setStoredSession(session);
    return session;
  },

  async logout(): Promise<void> {
    clearStoredSession();
  },

  async refreshSession(): Promise<AuthSession | null> {
    return getStoredSession();
  },
};
