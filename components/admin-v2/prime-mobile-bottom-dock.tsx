'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import type { RoleNavItem } from '@/lib/auth/role-routes';
import { isNavItemActive } from '@/lib/auth/role-routes';
import { cn } from '@/lib/utils';

type PrimeMobileBottomDockProps = {
  dockItems: RoleNavItem[];
  overflowItems: RoleNavItem[];
  iconMap: Record<string, LucideIcon>;
  activeHref: string;
  onOpenMore: () => void;
  variant?: 'athlete' | 'trainer';
};

function dockLabel(label: string): string {
  const first = label.split(' ')[0] ?? label;
  return first.length > 8 ? `${first.slice(0, 7)}…` : first;
}

export function PrimeMobileBottomDock({
  dockItems,
  overflowItems,
  iconMap,
  activeHref,
  onOpenMore,
  variant = 'athlete',
}: PrimeMobileBottomDockProps) {
  const showMore = overflowItems.length > 0;
  const moreActive = overflowItems.some((item) => isNavItemActive(activeHref, item));

  const activeClass =
    variant === 'athlete' ? 'gp-text-phosphor' : 'text-[#83e77b]';
  const inactiveClass =
    variant === 'athlete' ? 'gp-text-muted opacity-70' : 'text-[#becab8]/70';

  return (
    <nav
      className="fixed bottom-0 left-0 z-40 flex w-full items-stretch justify-around border-t gp-border-outline bg-[#0d1511]/95 px-1 py-2 backdrop-blur-sm pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Navegación principal"
    >
      {dockItems.map((item) => {
        const Icon = iconMap[item.href];
        if (!Icon) return null;
        const isActive = isNavItemActive(activeHref, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 transition-colors',
              isActive ? activeClass : inactiveClass,
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className="gp-mono w-full truncate text-center text-[10px] font-bold uppercase tracking-wide">
              {dockLabel(item.label)}
            </span>
          </Link>
        );
      })}
      {showMore ? (
        <button
          type="button"
          onClick={onOpenMore}
          className={cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 transition-colors',
            moreActive ? activeClass : inactiveClass,
          )}
          aria-label="Más opciones de navegación"
        >
          <MoreHorizontal className="size-5 shrink-0" aria-hidden />
          <span className="gp-mono text-[10px] font-bold uppercase tracking-wide">Más</span>
        </button>
      ) : null}
    </nav>
  );
}
