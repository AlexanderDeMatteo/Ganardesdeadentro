'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { ComponentProps } from 'react';

type LuminousButtonProps = Omit<ComponentProps<typeof Button>, 'variant'> & {
  luminousVariant?: 'primary' | 'ghost';
};

export function LuminousButton({
  className,
  luminousVariant = 'primary',
  children,
  ...props
}: LuminousButtonProps) {
  const isPrimary = luminousVariant === 'primary';

  return (
    <motion.div
      className="relative inline-flex w-full sm:w-auto"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
    >
      <span
        className={cn(
          'pointer-events-none absolute -inset-px rounded-none opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100',
          isPrimary ? 'bg-[var(--landing-green)]' : 'bg-[var(--landing-green-pastel)]',
        )}
        aria-hidden
      />
      <Button
        className={cn(
          'group relative h-12 w-full rounded-none px-8 text-xs font-black uppercase tracking-[0.16em] shadow-none transition-shadow duration-300 sm:text-sm',
          isPrimary
            ? 'border-2 border-[var(--landing-green-dark)] bg-[var(--landing-green)] text-[var(--landing-bg)] hover:bg-[color-mix(in_srgb,var(--landing-green)_92%,white)] hover:shadow-[var(--landing-glow-button)]'
            : 'border-2 border-[var(--landing-green-pastel)] bg-transparent text-[var(--landing-green-pastel)] hover:bg-[var(--landing-green)]/10 hover:shadow-[0_0_24px_rgb(206_222_185_/_0.2)]',
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}
