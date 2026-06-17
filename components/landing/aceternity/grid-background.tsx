'use client';

import { cn } from '@/lib/utils';

type GridBackgroundProps = {
  className?: string;
};

export function GridBackground({ className }: GridBackgroundProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      <div
        className="absolute inset-0 [background-image:radial-gradient(rgb(104_202_98_/_0.12)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        data-landing-animate
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(37_88_49_/_0.2),transparent_55%)]" />
    </div>
  );
}
