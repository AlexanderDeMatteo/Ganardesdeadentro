'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { HudCanvas } from '@/components/admin-v3/hud-canvas';
import { HudDock } from '@/components/admin-v3/hud-dock';

export function HudRoot({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <HudCanvas>
        {children}
        <HudDock />
      </HudCanvas>
    </ProtectedRoute>
  );
}
