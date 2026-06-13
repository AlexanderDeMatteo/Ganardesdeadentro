export interface Membership {
  id: string;
  name: 'Básica' | 'Premium' | 'Pro';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  price: number;
  features: string[];
  durationDays?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | 'trainer';
  trainer_id?: string;
  membership?: Membership;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthClient {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  refreshSession(): Promise<AuthSession | null>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  updateProfile(patch: { first_name?: string; last_name?: string }): Promise<void>;
  validateInviteToken?(token: string): Promise<{ email: string; firstName: string; expiresAt: string }>;
  acceptInvite?(token: string, password: string): Promise<void>;
}
