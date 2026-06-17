'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PrimeModuleProps = {
  modId: string;
  title: string;
  variant?: 'default' | 'critical' | 'reactor';
  className?: string;
  style?: CSSProperties;
  headerAction?: ReactNode;
  children: ReactNode;
};

export function PrimeModule({
  modId,
  title,
  variant = 'default',
  className,
  style,
  headerAction,
  children,
}: PrimeModuleProps) {
  return (
    <section
      className={cn(
        'gp-module gp-module-corner flex flex-col',
        variant === 'reactor' && 'is-reactor',
        variant === 'critical' && 'is-critical',
        className,
      )}
      style={style}
    >
      <header className="gp-module-header">
        <p className="gp-module-id">
          <strong>MOD-{modId}</strong>
          {' // '}
          {title}
        </p>
        {headerAction}
      </header>
      {children}
    </section>
  );
}
