'use client';

import { GridBackground } from '@/components/landing/aceternity/grid-background';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type GlowPosition = 'top' | 'center' | 'bottom' | 'none';

type LandingSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  glow?: GlowPosition;
  divider?: boolean;
  'aria-labelledby'?: string;
};

const glowClass: Record<Exclude<GlowPosition, 'none'>, string> = {
  top: 'bg-[var(--landing-v4-section-glow)]',
  center: 'bg-[var(--landing-v4-pillar-echo)]',
  bottom:
    'bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgb(104_202_98_/_0.12),transparent_70%)]',
};

export function LandingSection({
  id,
  children,
  className,
  glow = 'none',
  divider = false,
  'aria-labelledby': ariaLabelledby,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn('relative scroll-mt-24 overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28', className)}
      aria-labelledby={ariaLabelledby}
    >
      <GridBackground className="opacity-30" />
      {glow !== 'none' && (
        <div className={cn('pointer-events-none absolute inset-0', glowClass[glow])} aria-hidden />
      )}
      {divider && (
        <div className="landing-v4-divider pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-4xl" aria-hidden />
      )}
      <div className="relative z-10 mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
