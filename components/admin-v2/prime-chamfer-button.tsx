'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PrimeChamferButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
};

export function PrimeChamferButton({
  children,
  onClick,
  type = 'button',
  disabled,
  className,
}: PrimeChamferButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'gp-chamfer gp-mono inline-flex items-center justify-center gap-2 bg-[var(--gp-phosphor)] px-5 py-3 text-sm font-bold text-[#003906] transition-all hover:bg-[var(--gp-phosphor-bright)] hover:gp-phosphor-glow disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}
