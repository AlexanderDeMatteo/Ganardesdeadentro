'use client';

import { ArrowRight } from 'lucide-react';
import type { PrimaryStat } from '@/components/metrics/metrics-stats-helpers';

export function MetricsPrimaryStatCards({ stats }: { stats: PrimaryStat[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="group brand-card brand-card-hover rounded-2xl p-8">
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 text-white`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
            <p className="mb-3 text-3xl font-black text-foreground">{stat.value}</p>

            {stat.change && (
              <div className="flex items-center gap-2">
                {stat.isPositive ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-500">
                    <ArrowRight className="h-4 w-4 rotate-45" />+{stat.change}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-semibold text-red-500">
                    <ArrowRight className="h-4 w-4 -rotate-45" />-{stat.change}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
