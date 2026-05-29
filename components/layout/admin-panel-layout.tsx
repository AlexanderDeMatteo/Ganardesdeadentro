'use client';

import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Link as LinkIcon,
  CreditCard,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RolePanelShell } from '@/components/layout/role-panel-shell';
import { ADMIN_NAV_ITEMS } from '@/lib/auth/role-routes';

const ADMIN_ICON_MAP = {
  '/admin': LayoutDashboard,
  '/admin/athletes': Users,
  '/admin/trainers': Users,
  '/admin/routines': Dumbbell,
  '/admin/assignments': LinkIcon,
  '/admin/memberships': CreditCard,
} as const;

export function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <RolePanelShell navItems={ADMIN_NAV_ITEMS} iconMap={ADMIN_ICON_MAP}>
        {children}
      </RolePanelShell>
    </ProtectedRoute>
  );
}
