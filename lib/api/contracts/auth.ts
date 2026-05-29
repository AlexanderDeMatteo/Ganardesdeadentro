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

export interface MeResponse {
  user: AuthUserResponse;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface LogoutResponse {
  message: string;
}
