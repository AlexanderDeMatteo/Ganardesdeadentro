'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AthletePrimeShell } from '@/components/athlete-prime/athlete-prime-shell';

export function AthletePrimeRoot({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AthletePrimeShell>{children}</AthletePrimeShell>
    </ProtectedRoute>
  );
}
