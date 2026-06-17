'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type PrimeTableRowActionProps = {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
};

const actionClass =
  'gp-btn-ghost inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gp-phosphor)]';

export function PrimeTableRowAction({
  label,
  children,
  onClick,
  href,
  className,
}: PrimeTableRowActionProps) {
  const stopRowSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={cn(actionClass, className)}
        onClick={stopRowSelect}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(actionClass, className)}
      onClick={(e) => {
        stopRowSelect(e);
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
