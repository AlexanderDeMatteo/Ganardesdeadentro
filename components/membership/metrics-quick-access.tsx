'use client';

import Link from 'next/link';
import { useMetrics } from '@/hooks/use-metrics';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MetricsQuickAccess() {
  const { getLatestEntry, getProgressChange } = useMetrics();
  const latest = getLatestEntry();

  if (!latest) {
    return null;
  }

  const weightChange = getProgressChange('weight');
  const bodyFatChange = getProgressChange('bodyFat');

  return (
    <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-secondary/10 to-secondary/5 p-6 backdrop-blur-sm space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-secondary" />
        <h3 className="font-semibold text-foreground">Tu Progreso</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background/50 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Peso</p>
          <p className="text-lg font-bold text-foreground">{latest.weight?.toFixed(1)} kg</p>
          {weightChange && (
            <p className={`text-xs font-semibold ${weightChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {weightChange < 0 ? '↓' : '↑'} {Math.abs(weightChange).toFixed(1)} kg
            </p>
          )}
        </div>

        <div className="rounded-lg bg-background/50 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Grasa</p>
          <p className="text-lg font-bold text-foreground">
            {latest.bodyFat != null
              ? `${latest.bodyFat.toFixed(1)}%${latest.bodyFatSource === 'estimated' ? ' (est.)' : ''}`
              : '—'}
          </p>
          {bodyFatChange && (
            <p className={`text-xs font-semibold ${bodyFatChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {bodyFatChange < 0 ? '↓' : '↑'} {Math.abs(bodyFatChange).toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      <Link href="/metrics" className="block">
        <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10 text-sm">
          Ver métricas completas
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
