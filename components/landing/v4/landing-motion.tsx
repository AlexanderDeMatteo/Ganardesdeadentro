'use client';

import FadeContent from '@/components/FadeContent/FadeContent';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type LandingFadeProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function LandingFade({ children, className, delay = 0 }: LandingFadeProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <FadeContent className={className} delay={delay} threshold={0.15} duration={800}>
      {children}
    </FadeContent>
  );
}

type LandingScrollTitleProps = {
  title: string;
  className?: string;
  id?: string;
};

export function LandingScrollTitle({ title, className, id }: LandingScrollTitleProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <h2 id={id} className={cn('landing-heading text-4xl text-[var(--landing-green)] sm:text-5xl', className)}>
        {title}
      </h2>
    );
  }

  return (
    <ScrollReveal
      containerClassName="!my-0"
      textClassName={cn(
        'landing-heading !text-4xl !leading-[0.92] text-[var(--landing-green)] sm:!text-5xl',
        className,
      )}
      enableBlur={false}
      baseOpacity={0.2}
    >
      {title}
    </ScrollReveal>
  );
}
