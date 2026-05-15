'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Weight } from 'lucide-react';
import type { MetricEntry } from '@/hooks/use-metrics';

export type PrimaryStat = {
  label: string;
  value: string;
  change: string | null;
  isPositive: boolean;
  icon: LucideIcon;
  color: string;
};

export function buildPrimaryStats(
  latest: MetricEntry | null,
  getProgressChange: (metric: keyof MetricEntry) => number | null,
): PrimaryStat[] {
  const getMetricDisplay = (key: 'weight' | 'bodyFat' | 'muscleMass', unit: string) => {
    const change = getProgressChange(key);
    if (!latest || latest[key] === undefined) {
      return { value: '—', change: null as string | null, isPositive: false };
    }

    const isPositive =
      key === 'weight' || key === 'bodyFat'
        ? change != null && change < 0
        : change != null && change > 0;

    return {
      value: `${latest[key]!.toFixed(1)} ${unit}`,
      change: change != null ? Math.abs(change).toFixed(1) : null,
      isPositive,
    };
  };

  const weight = getMetricDisplay('weight', 'kg');
  const bodyFat = getMetricDisplay('bodyFat', '%');
  const bodyFatValueDisplay =
    latest?.bodyFat != null && latest.bodyFatSource === 'estimated'
      ? `${latest.bodyFat.toFixed(1)} % (est.)`
      : bodyFat.value;
  const muscleMass = getMetricDisplay('muscleMass', 'kg');

  return [
    {
      label: 'Peso',
      value: weight.value,
      change: weight.change,
      isPositive: weight.isPositive,
      icon: Weight,
      color: 'from-primary to-secondary',
    },
    {
      label: 'Grasa Corporal',
      value: bodyFatValueDisplay,
      change: bodyFat.change,
      isPositive: bodyFat.isPositive,
      icon: TrendingDown,
      color: 'from-accent to-destructive',
    },
    {
      label: 'Masa Muscular',
      value: muscleMass.value,
      change: muscleMass.change,
      isPositive: muscleMass.isPositive,
      icon: TrendingUp,
      color: 'from-primary to-secondary',
    },
  ];
}
