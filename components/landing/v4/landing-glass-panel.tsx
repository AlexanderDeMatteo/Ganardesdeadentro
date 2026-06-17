'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type LandingGlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export function LandingGlassPanel({ children, className }: LandingGlassPanelProps) {
  return (
    <div
      className={cn(
        'border border-white/10 bg-[color-mix(in_srgb,var(--landing-surface)_80%,transparent)] p-6 shadow-[var(--landing-glow)] backdrop-blur-md sm:p-8',
        className,
      )}
    >
      {children}
    </div>
  );
}
