import type { LucideIcon } from 'lucide-react';
import { PrimeKpiCard } from '@/components/admin-v2/prime-kpi-card';

export type PrimeKpiStripItem = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  layout?: 'satellite' | 'critical';
  footer?: string;
  href?: string;
};

type PrimeKpiStripProps = {
  items: PrimeKpiStripItem[];
  className?: string;
};

export function PrimeKpiStrip({ items, className }: PrimeKpiStripProps) {
  return (
    <div
      className={
        className ??
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
      }
    >
      {items.map((item, i) => (
        <PrimeKpiCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          layout={item.layout ?? 'satellite'}
          href={item.href}
          footer={item.footer}
          enterDelay={i * 60}
        />
      ))}
    </div>
  );
}
