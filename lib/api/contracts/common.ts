export interface ApiErrorBody {
  error: string;
  required?: string[];
}

export type UserRole = 'user' | 'admin' | 'trainer';
