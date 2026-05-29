'use client';

import { useAuth } from '@/app/context/auth-context';
import {
  canRoleAccessPath,
  getHomeRouteForRole,
  getRedirectForWrongRole,
} from '@/lib/auth/role-routes';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'trainer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && !user) {
      return;
    }

    if (!isLoading && requiredRole && user?.role !== requiredRole) {
      router.push(getRedirectForWrongRole(user!.role));
      return;
    }

    if (
      !isLoading &&
      isAuthenticated &&
      user &&
      !requiredRole &&
      !canRoleAccessPath(user.role, pathname)
    ) {
      router.push(getHomeRouteForRole(user.role));
    }
  }, [isLoading, isAuthenticated, requiredRole, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/5">
        <div className="space-y-4 text-center">
          <div className="inline-flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  if (!requiredRole && !canRoleAccessPath(user.role, pathname)) {
    return null;
  }

  return <>{children}</>;
}
