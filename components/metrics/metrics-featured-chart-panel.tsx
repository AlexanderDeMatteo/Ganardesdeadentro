'use client';

import { useState } from 'react';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import {
  metricsReplicaChartPanelClassName,
  metricsReplicaPanelSurfaceStyle,
} from '@/components/metrics/metrics-replica-panel-tokens';
import { Button } from '@/components/ui/button';

const FEATURED_METRICS = [
  { id: 'weight', title: 'Peso', metric: 'weight' as const, unit: 'kg', color: 'var(--primary)' },
  { id: 'bodyFat', title: 'Grasa corporal', metric: 'bodyFat' as const, unit: '%', color: 'var(--destructive)' },
  { id: 'muscleMass', title: 'Masa muscular', metric: 'muscleMass' as const, unit: 'kg', color: 'var(--chart-3)' },
  { id: 'waist', title: 'Cintura', metric: 'waist' as const, unit: 'cm', color: 'var(--secondary)' },
  { id: 'chest', title: 'Pecho', metric: 'chest' as const, unit: 'cm', color: 'var(--primary)' },
  { id: 'hips', title: 'Cadera', metric: 'hips' as const, unit: 'cm', color: 'var(--chart-4)' },
  { id: 'bicepsAvg', title: 'Bíceps (prom.)', metric: 'bicepsAvg' as const, unit: 'cm', color: 'var(--chart-2)' },
  { id: 'thighAvg', title: 'Muslos (prom.)', metric: 'thighAvg' as const, unit: 'cm', color: 'var(--chart-5)' },
  { id: 'calfAvg', title: 'Pantorrillas (prom.)', metric: 'calfAvg' as const, unit: 'cm', color: 'var(--chart-1)' },
] as const;

export type MetricsFeaturedMetricId = (typeof FEATURED_METRICS)[number]['id'];

export interface MetricsFeaturedChartPanelProps {
  /** Altura del área del gráfico en px (por defecto 360, como en la opción analítica). */
  chartHeight?: number;
  /** Aplica `text-white` al panel (recomendado sobre fondo oscuro). */
  textWhite?: boolean;
}

export function MetricsFeaturedChartPanel({
  chartHeight = 360,
  textWhite = true,
}: MetricsFeaturedChartPanelProps) {
  const [featuredId, setFeaturedId] = useState<string>(FEATURED_METRICS[0].id);
  const featured = FEATURED_METRICS.find((m) => m.id === featuredId) ?? FEATURED_METRICS[0];

  return (
    <div
      className={metricsReplicaChartPanelClassName({ textWhite })}
      style={metricsReplicaPanelSurfaceStyle}
    >
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/55">
        Métrica destacada
      </p>
      <div className="flex flex-wrap gap-2">
        {FEATURED_METRICS.map((m) => (
          <Button
            key={m.id}
            type="button"
            size="sm"
            variant={featuredId === m.id ? 'default' : 'outline'}
            className={
              featuredId === m.id
                ? 'text-xs'
                : 'border-white/20 bg-white/[0.06] text-xs text-white/85 hover:border-white/35 hover:bg-white/10 hover:text-white'
            }
            onClick={() => setFeaturedId(m.id)}
          >
            {m.title}
          </Button>
        ))}
      </div>
      <div className="mt-4">
        <MetricsChart
          title={featured.title}
          metric={featured.metric}
          unit={featured.unit}
          color={featured.color}
          height={chartHeight}
          variant="plain"
        />
      </div>
    </div>
  );
}
