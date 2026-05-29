'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthClient } from '@/lib/auth/auth-client';
import type { AuthUser, Membership } from '@/lib/auth/auth-types';
import { getStoredUser } from '@/lib/auth/session-store';

export type { Membership };
export type User = AuthUser;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, first_name: string, last_name: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
        }
        const session = await getAuthClient().refreshSession();
        if (!cancelled && session) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error loading stored user:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await getAuthClient().login({ email, password });
      setUser(session.user);
      return session.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, first_name: string, last_name: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await getAuthClient().register({
          email,
          password,
          first_name,
          last_name,
        });
        setUser(session.user);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    void getAuthClient().logout();
    setUser(null);
    setError(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const session = await getAuthClient().refreshSession();
    setUser(session?.user ?? null);
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
    refreshSession,
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
