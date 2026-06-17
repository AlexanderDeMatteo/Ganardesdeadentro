import type { ReactNode } from 'react';

type PrimePageHeaderProps = {
  title: string;
  subtitle: string;
  action?: ReactNode;
};

export function PrimePageHeader({ title, subtitle, action }: PrimePageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="gp-display text-3xl gp-text-primary neon-text-glow">{title}</h2>
        <p className="gp-mono mt-1 text-sm gp-text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
