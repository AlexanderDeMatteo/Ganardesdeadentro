'use client';

import { useAuth } from '@/app/context/auth-context';
import { ClipboardList, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PrimePowerRail } from '@/components/admin-v2/prime-power-rail';
import { ADMIN_V2_NAV_ICON_MAP } from '@/lib/admin-v2/admin-v2-nav-icons';
import { ADMIN_V2_NAV_ITEMS } from '@/lib/auth/role-routes';
import { cn } from '@/lib/utils';

type PrimeSidebarNavProps = {
  activeHref: string;
  onNavigate?: () => void;
  showLogo?: boolean;
  className?: string;
};

export function PrimeSidebarNav({
  activeHref,
  onNavigate,
  showLogo = true,
  className,
}: PrimeSidebarNavProps) {
  const { logout } = useAuth();

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {showLogo ? (
        <div className="gp-sidebar-header-texture mb-4 flex shrink-0 flex-col items-center px-6 pb-2">
          <Image
            src="/brand/be-a-gainer-logo.png"
            alt="BE A GAINER LIFE"
            width={112}
            height={112}
            className="gp-logo-halo h-auto w-28 object-contain"
            priority
          />
        </div>
      ) : null}

      <div className="mb-4 shrink-0 px-6">
        <Link
          href="/admin-v2/athletes"
          onClick={onNavigate}
          className="gp-chamfer gp-mono flex w-full items-center justify-center gap-2 bg-[#68ca62] py-2.5 text-sm font-bold text-[#003906] transition-all hover:bg-[#83e77b] hover:gp-phosphor-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          ASIGNAR ATLETAS
        </Link>
      </div>

      <div className="gp-power-rail-track relative min-h-0 flex-1 overflow-y-auto px-4">
        <PrimePowerRail activeHref={activeHref} />
        <ul className="space-y-1">
          {ADMIN_V2_NAV_ITEMS.map((item) => {
            const Icon = ADMIN_V2_NAV_ICON_MAP[item.href];
            const isActive = item.exact
              ? activeHref === item.href
              : activeHref === item.href || activeHref.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-r-md border-l-4 border-transparent pl-4 pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]',
                    isActive
                      ? 'gp-power-bar-active font-bold text-[#83e77b]'
                      : 'text-[#becab8] hover:bg-[#2e3732]/50 hover:text-[#83e77b]',
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

      <div className="mx-4 shrink-0 border-t border-[#3f4a3c] pt-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-r-md px-4 py-2 text-[#becab8]/80 transition-colors hover:bg-red-950/40 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span className="gp-mono text-sm">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
