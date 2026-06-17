'use client';

import { LandingScrollTitle } from '@/components/landing/v4/landing-motion';
import { cn } from '@/lib/utils';

type LandingSectionHeaderProps = {
  kicker?: string;
  title: string;
  titleId?: string;
  titleClassName?: string;
  kickerClassName?: string;
  description?: string;
  className?: string;
};

export function LandingSectionHeader({
  kicker,
  title,
  titleId,
  titleClassName,
  kickerClassName,
  description,
  className,
}: LandingSectionHeaderProps) {
  return (
    <div className={cn('mb-14 max-w-2xl space-y-3', className)}>
      {kicker && (
        <p
          className={cn(
            'text-sm font-semibold uppercase tracking-[0.14em] text-[var(--landing-green-pastel)]/80',
            kickerClassName,
          )}
        >
          {kicker}
        </p>
      )}
      <LandingScrollTitle title={title} id={titleId} className={titleClassName} />
      {description && (
        <p className="text-sm leading-relaxed text-white/70 sm:text-base">{description}</p>
      )}
    </div>
  );
}
