'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { PrimeShell } from '@/components/admin-v2/prime-shell';

export function PrimeRoot({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <PrimeShell>{children}</PrimeShell>
    </ProtectedRoute>
  );
}
