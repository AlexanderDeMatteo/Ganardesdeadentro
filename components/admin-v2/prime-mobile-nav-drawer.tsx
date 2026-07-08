'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { RoleNavItem } from '@/lib/auth/role-routes';
import { isNavItemActive } from '@/lib/auth/role-routes';
import { cn } from '@/lib/utils';

type PrimeMobileNavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: RoleNavItem[];
  iconMap: Record<string, LucideIcon>;
  activeHref: string;
  ariaLabel?: string;
};

export function PrimeMobileNavDrawer({
  open,
  onOpenChange,
  navItems,
  iconMap,
  activeHref,
  ariaLabel = 'Menú de navegación',
}: PrimeMobileNavDrawerProps) {
  const { logout } = useAuth();

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="gp-sidebar-gradient w-[280px] border-[#3f4a3c] p-0 pt-5"
        aria-label={ariaLabel}
      >
        <SheetTitle className="sr-only">{ariaLabel}</SheetTitle>
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = iconMap[item.href];
                const isActive = isNavItemActive(activeHref, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className={cn(
                        'flex h-11 items-center gap-3 rounded-r-md border-l-4 border-transparent pl-4 pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]',
                        isActive
                          ? 'gp-power-bar-active font-bold gp-text-phosphor'
                          : 'gp-text-muted hover:bg-[#2e3732]/50 hover:gp-text-phosphor',
                      )}
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
                      <span className="gp-mono text-sm">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mx-4 shrink-0 border-t gp-border-outline pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={() => {
                close();
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-r-md px-4 py-2 gp-text-muted opacity-80 transition-colors hover:bg-red-950/40 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              <span className="gp-mono text-sm">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
