'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Membership {
  id: string;
  name: 'Básica' | 'Premium' | 'Pro';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  price: number;
  features: string[];
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  membership?: Membership;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, first_name: string, last_name: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS = {
  'test@example.com': {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Juan',
    last_name: 'Pérez',
    role: 'user' as const,
    membership: {
      id: 'mem-1',
      name: 'Premium' as const,
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
    role: 'admin' as const,
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading stored user:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS];

      if (!mockUser || mockUser.password !== password) {
        throw new Error('Invalid email or password');
      }

      let membership = (mockUser as any).membership;
      if (membership) {
        const today = new Date();
        const endDate = new Date(membership.endDate);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        membership = {
          ...membership,
          daysRemaining: Math.max(0, daysRemaining),
        };
      }

      const userData: User = {
        id: mockUser.id,
        email: mockUser.email,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name,
        role: mockUser.role,
        membership,
      };

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('access_token', 'mock_token_' + Date.now());
      setUser(userData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, first_name: string, last_name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (MOCK_USERS[email as keyof typeof MOCK_USERS]) {
        throw new Error('Email already exists');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const newUser: User = {
        id: Date.now().toString(),
        email,
        first_name,
        last_name,
        role: 'user',
      };

      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('access_token', 'mock_token_' + Date.now());
      setUser(newUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
