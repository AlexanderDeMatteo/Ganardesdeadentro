'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PrimeSidebar } from '@/components/admin-v2/prime-sidebar';
import { PrimeSidebarNav } from '@/components/admin-v2/prime-sidebar-nav';
import { PrimeTopBar } from '@/components/admin-v2/prime-top-bar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

type PrimeShellProps = {
  children: React.ReactNode;
};

export function PrimeShell({ children }: PrimeShellProps) {
  const pathname = usePathname() ?? '';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="gainer-prime-root flex min-h-screen">
      <PrimeSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[280px]">
        <PrimeTopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <div className="gp-canvas-wrap flex-1 pt-20">
          <main id="main-content" className="gp-canvas gp-vignette flex-1">
            <div className="gp-scanline" aria-hidden />
            <div className="gp-canvas-content overflow-auto px-4 pb-24 pt-6 md:px-10 md:pb-8 md:pt-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="gp-sidebar-gradient w-[280px] border-[#3f4a3c] p-0 pt-5"
          aria-label="Menú de navegación admin"
        >
          <SheetTitle className="sr-only">Navegación admin</SheetTitle>
          <PrimeSidebarNav
            activeHref={pathname}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
