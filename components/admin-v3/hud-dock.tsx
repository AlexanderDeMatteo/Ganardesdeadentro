'use client';

import {
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Link2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_V3_NAV_ITEMS } from '@/lib/auth/role-routes';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  '/admin-v3': LayoutDashboard,
  '/admin-v3/athletes': Users,
  '/admin-v3/routines': Dumbbell,
  '/admin-v3/assignments': Link2,
  '/admin-v3/memberships': CreditCard,
} as const;

export function HudDock() {
  const pathname = usePathname() ?? '';

  return (
    <nav aria-label="Navegación COMANDO" className="hud-dock">
      {ADMIN_V3_NAV_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.href as keyof typeof ICON_MAP];
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('hud-dock-link', isActive && 'is-active')}
          >
            {Icon ? <Icon className="h-5 w-5" aria-hidden /> : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
