import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type PrimeKpiCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  layout?: 'satellite' | 'critical';
  enterDelay?: number;
  footer?: string;
  footerIcon?: LucideIcon;
  footerClassName?: string;
};

export function PrimeKpiCard({
  label,
  value,
  icon: Icon,
  href,
  onClick,
  ariaLabel,
  layout = 'satellite',
  enterDelay = 0,
  footer,
  footerIcon: FooterIcon,
  footerClassName,
}: PrimeKpiCardProps) {
  const isCritical = layout === 'critical';
  const isInteractive = Boolean(onClick && !href);

  const content = (
    <div
      className={cn(
        'gp-module gp-module-corner gp-enter relative overflow-hidden p-5 transition-colors',
        isCritical ? 'gp-phosphor-glow-critical is-critical' : 'gp-kpi-satellite',
        layout === 'satellite' && 'p-4',
        isInteractive && 'cursor-pointer hover:border-[#ffb4ab]/40',
      )}
      style={{ '--gp-delay': `${enterDelay}ms` } as CSSProperties}
    >
      <div className={cn('flex items-start justify-between', isCritical ? 'mb-5' : 'mb-3')}>
        <div
          className={cn(
            'rounded-full p-2',
            isCritical
              ? 'bg-[#ffb4ab]/10 text-[#ffb4ab]'
              : 'bg-[#68ca62]/10 text-[#68ca62]',
          )}
        >
          <Icon className={cn('h-5 w-5', layout === 'satellite' && 'h-4 w-4')} aria-hidden />
        </div>
        {isCritical ? (
          <span className="gp-pulse-hardware h-2.5 w-2.5 rounded-full bg-[#ffb4ab]" aria-hidden />
        ) : null}
      </div>
      <div>
        <p
          className={cn(
            'gp-metric font-bold leading-none text-[#dce5de]',
            isCritical ? 'text-5xl' : 'text-3xl',
          )}
        >
          {value}
        </p>
        <p className="gp-mono mt-2 text-xs uppercase text-[#becab8]">{label}</p>
      </div>
      {footer ? (
        <div className={cn('gp-metric mt-3 flex items-center gap-1 text-xs', footerClassName)}>
          {FooterIcon ? <FooterIcon className="h-3.5 w-3.5" aria-hidden /> : null}
          <span>{footer}</span>
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
      >
        {content}
      </button>
    );
  }

  return content;
}
