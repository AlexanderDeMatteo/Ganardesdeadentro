'use client';

import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Link as LinkIcon,
  TrendingUp,
  User,
  Sparkles,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RolePanelShell } from '@/components/layout/role-panel-shell';
import { TRAINER_NAV_ITEMS } from '@/lib/auth/role-routes';

const TRAINER_ICON_MAP = {
  '/trainer': LayoutDashboard,
  '/trainer/athletes': Users,
  '/trainer/routines': Dumbbell,
  '/trainer/exercises': Sparkles,
  '/trainer/assignments': LinkIcon,
  '/trainer/progress': TrendingUp,
  '/trainer/profile': User,
} as const;

export function TrainerPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="trainer">
      <RolePanelShell navItems={TRAINER_NAV_ITEMS} iconMap={TRAINER_ICON_MAP}>
        {children}
      </RolePanelShell>
    </ProtectedRoute>
  );
}
