import type { UserRole } from './common';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthUserResponse {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active?: boolean;
  created_at?: string | null;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUserResponse;
  message?: string;
}

export interface RegisterResponse {
  access_token: string;
  user: AuthUserResponse;
  message?: string;
}

export interface MeMembershipResponse {
  planId: string;
  name: 'Básica' | 'Premium' | 'Pro' | string;
  daysRemaining: number;
  features?: string[];
  startDate?: string;
  endDate?: string;
  price?: number;
  durationDays?: number;
}

export interface MeResponse {
  user: AuthUserResponse;
  membership: MeMembershipResponse | null;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface LogoutResponse {
  message: string;
}

export interface InviteValidationResponse {
  email: string;
  firstName: string;
  expiresAt: string;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

export interface AcceptInviteResponse {
  message: string;
}
