'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { TrainerPrimeShell } from '@/components/trainer-v2/trainer-prime-shell';

export function TrainerPrimeRoot({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerPrimeShell>{children}</TrainerPrimeShell>
    </ProtectedRoute>
  );
}
