'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AthletePrimeSidebar } from '@/components/athlete-prime/athlete-prime-sidebar';
import { AthletePrimeTopBar } from '@/components/athlete-prime/athlete-prime-top-bar';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { ATHLETE_PRIME_NAV_ICON_MAP } from '@/lib/athlete-prime/athlete-prime-nav-icons';
import { ATHLETE_NAV_ITEMS, isNavItemActive } from '@/lib/auth/role-routes';
import { cn } from '@/lib/utils';

type AthletePrimeShellProps = {
  children: React.ReactNode;
};

export function AthletePrimeShell({ children }: AthletePrimeShellProps) {
  const pathname = usePathname() ?? '';

  return (
    <div className="gainer-prime-root flex min-h-screen">
      <AthletePrimeSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[280px]">
        <ExpirationAlert />
        <AthletePrimeTopBar />
        <div className="gp-canvas-wrap flex-1 pt-20">
          <main id="main-content" className="gp-canvas gp-vignette flex-1">
            <div className="gp-scanline" aria-hidden />
            <div className="gp-canvas-content overflow-auto px-4 pb-24 pt-6 md:px-10 md:pb-8 md:pt-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around overflow-x-auto border-t gp-border-outline bg-[#0d1511]/95 py-2 px-1 backdrop-blur-sm md:hidden"
        aria-label="Navegación principal"
      >
        {ATHLETE_NAV_ITEMS.map((item) => {
          const Icon = ATHLETE_PRIME_NAV_ICON_MAP[item.href];
          if (!Icon) return null;
          const isActive = isNavItemActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[3rem] flex-col items-center gap-0.5 p-1.5 transition-colors',
                isActive ? 'gp-text-phosphor' : 'gp-text-muted opacity-70',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="gp-mono truncate text-[8px] font-bold uppercase tracking-wide">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
