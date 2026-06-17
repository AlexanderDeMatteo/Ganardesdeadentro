import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type HudPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
};

export function HudPanel({ title, subtitle, children, className, headerAction }: HudPanelProps) {
  return (
    <section className={cn('hud-panel flex flex-col', className)}>
      <header className="hud-panel-header flex items-center justify-between gap-2">
        <div>
          <span>{title}</span>
          {subtitle ? (
            <span className="ml-2 text-[#68ca62]/70">{'// '}{subtitle}</span>
          ) : null}
        </div>
        {headerAction}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}
