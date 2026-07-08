'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AthletePrimeSidebar } from '@/components/athlete-prime/athlete-prime-sidebar';
import { AthletePrimeTopBar } from '@/components/athlete-prime/athlete-prime-top-bar';
import { PrimeMobileBottomDock } from '@/components/admin-v2/prime-mobile-bottom-dock';
import { PrimeMobileNavDrawer } from '@/components/admin-v2/prime-mobile-nav-drawer';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { useAuth } from '@/app/context/auth-context';
import { ATHLETE_PRIME_NAV_ICON_MAP } from '@/lib/athlete-prime/athlete-prime-nav-icons';
import {
  ATHLETE_MOBILE_DOCK_HREFS,
  getPrimeMobileDockItems,
  getPrimeMobileOverflowItems,
} from '@/lib/admin-v2/prime-mobile-nav';
import { ATHLETE_NAV_ITEMS } from '@/lib/auth/role-routes';
import { filterAthleteNavForMembership, getMembershipDaysRemaining } from '@/lib/membership/access';

type AthletePrimeShellProps = {
  children: React.ReactNode;
};

export function AthletePrimeShell({ children }: AthletePrimeShellProps) {
  const pathname = usePathname() ?? '';
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems = filterAthleteNavForMembership(
    ATHLETE_NAV_ITEMS,
    getMembershipDaysRemaining(user?.membership),
  );

  const dockItems = useMemo(
    () => getPrimeMobileDockItems(navItems, ATHLETE_MOBILE_DOCK_HREFS),
    [navItems],
  );
  const overflowItems = useMemo(
    () => getPrimeMobileOverflowItems(navItems, dockItems),
    [navItems, dockItems],
  );

  return (
    <div className="gainer-prime-root flex min-h-screen">
      <AthletePrimeSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[280px]">
        <ExpirationAlert />
        <AthletePrimeTopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <div className="gp-canvas-wrap flex-1 pt-20">
          <main id="main-content" className="gp-canvas gp-vignette flex-1">
            <div className="gp-scanline" aria-hidden />
            <div className="gp-canvas-content overflow-auto px-4 pb-24 pt-6 md:px-10 md:pb-8 md:pt-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      <PrimeMobileBottomDock
        dockItems={dockItems}
        overflowItems={overflowItems}
        iconMap={ATHLETE_PRIME_NAV_ICON_MAP}
        activeHref={pathname}
        onOpenMore={() => setMobileNavOpen(true)}
        variant="athlete"
      />

      <PrimeMobileNavDrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        navItems={navItems}
        iconMap={ATHLETE_PRIME_NAV_ICON_MAP}
        activeHref={pathname}
        ariaLabel="Menú de navegación atleta"
      />
    </div>
  );
}
