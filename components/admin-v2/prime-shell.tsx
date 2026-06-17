'use client';

import { PrimeSidebar } from '@/components/admin-v2/prime-sidebar';
import { PrimeTopBar } from '@/components/admin-v2/prime-top-bar';

type PrimeShellProps = {
  children: React.ReactNode;
};

export function PrimeShell({ children }: PrimeShellProps) {
  return (
    <div className="gainer-prime-root flex min-h-screen">
      <PrimeSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[280px]">
        <PrimeTopBar />
        <div className="gp-canvas-wrap flex-1 pt-20">
          <main id="main-content" className="gp-canvas gp-vignette flex-1">
            <div className="gp-scanline" aria-hidden />
            <div className="gp-canvas-content overflow-auto px-4 pb-24 pt-6 md:px-10 md:pb-8 md:pt-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
