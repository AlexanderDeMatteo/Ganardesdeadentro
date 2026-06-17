'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type PrimeInspectorCtaProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
};

export function PrimeInspectorCta({ children, onClick, href, className }: PrimeInspectorCtaProps) {
  const classes = cn(
    'gp-module gp-chamfer gp-mono flex w-full items-center justify-center gap-2',
    'border gp-border-outline bg-[#19211d] px-4 py-3 text-sm gp-text-muted',
    'transition-all hover:gp-phosphor-glow hover:text-[#95fa8b]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gp-phosphor)]',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
