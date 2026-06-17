'use client';

import { useAuth } from '@/app/context/auth-context';
import { Dumbbell, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AthletePowerRail } from '@/components/athlete-prime/athlete-power-rail';
import { ATHLETE_PRIME_NAV_ICON_MAP } from '@/lib/athlete-prime/athlete-prime-nav-icons';
import { ATHLETE_NAV_ITEMS } from '@/lib/auth/role-routes';
import { cn } from '@/lib/utils';

export function AthletePrimeSidebar() {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();

  return (
    <nav
      aria-label="Navegación atleta"
      className="gp-sidebar-gradient fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col overflow-hidden border-r gp-border-outline py-5 md:flex"
    >
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

      <div className="mb-4 shrink-0 px-6">
        <Link
          href="/routines"
          className="gp-chamfer gp-mono gp-btn-phosphor flex w-full items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
        >
          <Dumbbell className="h-4 w-4" aria-hidden />
          ENTRENAR HOY
        </Link>
      </div>

      <div className="gp-power-rail-track relative min-h-0 flex-1 overflow-y-auto px-4">
        <AthletePowerRail activeHref={pathname} />
        <ul className="space-y-1">
          {ATHLETE_NAV_ITEMS.map((item) => {
            const Icon = ATHLETE_PRIME_NAV_ICON_MAP[item.href];
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-r-md border-l-4 border-transparent pl-4 pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]',
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

      <div className="mx-4 shrink-0 border-t gp-border-outline pt-3">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-r-md px-4 py-2 gp-text-muted opacity-80 transition-colors hover:bg-red-950/40 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span className="gp-mono text-sm">Cerrar sesión</span>
        </button>
      </div>
    </nav>
  );
}
