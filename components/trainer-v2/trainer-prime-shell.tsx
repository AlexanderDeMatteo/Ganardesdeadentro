'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TrainerPrimeSidebar } from '@/components/trainer-v2/trainer-prime-sidebar';
import { TrainerPrimeTopBar } from '@/components/trainer-v2/trainer-prime-top-bar';
import { PrimeMobileBottomDock } from '@/components/admin-v2/prime-mobile-bottom-dock';
import { PrimeMobileNavDrawer } from '@/components/admin-v2/prime-mobile-nav-drawer';
import { TRAINER_V2_NAV_ICON_MAP } from '@/lib/trainer-v2/trainer-v2-nav-icons';
import {
  TRAINER_MOBILE_DOCK_HREFS,
  getPrimeMobileDockItems,
  getPrimeMobileOverflowItems,
} from '@/lib/admin-v2/prime-mobile-nav';
import { TRAINER_V2_NAV_ITEMS } from '@/lib/auth/role-routes';

type TrainerPrimeShellProps = {
  children: React.ReactNode;
};

export function TrainerPrimeShell({ children }: TrainerPrimeShellProps) {
  const pathname = usePathname() ?? '';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const dockItems = useMemo(
    () => getPrimeMobileDockItems(TRAINER_V2_NAV_ITEMS, TRAINER_MOBILE_DOCK_HREFS),
    [],
  );
  const overflowItems = useMemo(
    () => getPrimeMobileOverflowItems(TRAINER_V2_NAV_ITEMS, dockItems),
    [dockItems],
  );

  return (
    <div className="gainer-prime-root flex min-h-screen">
      <TrainerPrimeSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[280px]">
        <TrainerPrimeTopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
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
        iconMap={TRAINER_V2_NAV_ICON_MAP}
        activeHref={pathname}
        onOpenMore={() => setMobileNavOpen(true)}
        variant="trainer"
      />

      <PrimeMobileNavDrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        navItems={TRAINER_V2_NAV_ITEMS}
        iconMap={TRAINER_V2_NAV_ICON_MAP}
        activeHref={pathname}
        ariaLabel="Menú de navegación entrenador"
      />
    </div>
  );
}
