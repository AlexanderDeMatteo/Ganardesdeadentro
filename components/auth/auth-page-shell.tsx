'use client';

import { CoachParallaxCard } from '@/components/landing/coach-parallax-card';
import { Vortex } from '@/components/ui/vortex';
import { LANDING_MASCOT_AUTH } from '@/lib/landing/mascot-config';
import type { ReactNode } from 'react';

type AuthPageShellProps = {
  children: ReactNode;
  kicker: string;
  headline: string;
  subcopy: string;
};

export function AuthPageShell({ children, kicker, headline, subcopy }: AuthPageShellProps) {
  return (
    <div className="landing-root landing-v4 flex h-dvh min-h-dvh flex-col overflow-hidden text-white">
      <Vortex
        backgroundColor="black"
        rangeY={800}
        particleCount={500}
        baseHue={120}
        className="flex items-center flex-col justify-center px-2 md:px-10  py-4 w-full h-full"
      >
        <main className="flex w-full items-center justify-center px-4 py-6 pb-10 sm:px-6 sm:pb-12 lg:px-8">
          <div className="flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-center lg:gap-20">
            <div className="hidden shrink-0 flex-col items-center gap-6 text-center lg:flex">
              <div className="w-full max-w-xs overflow-visible sm:max-w-sm">
                <CoachParallaxCard
                  mascot={LANDING_MASCOT_AUTH}
                  showGreeting={false}
                  className="mx-auto w-full items-center"
                />
              </div>

              <div className="max-w-xs space-y-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--landing-green-pastel)]">
                  {kicker}
                </p>
                <h1 className="landing-heading text-4xl leading-[0.95] text-white">{headline}</h1>
                <p className="text-sm leading-relaxed text-white/60">{subcopy}</p>
              </div>
            </div>

            <div className="w-full max-w-sm shrink-0 lg:max-w-md">{children}</div>
          </div>
        </main>
      </Vortex>
    </div>
  );
}
