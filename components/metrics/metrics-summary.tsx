'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMetrics } from '@/hooks/use-metrics';
import { BarChart3, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricsSummaryVariant = 'default' | 'brutalist';

export function MetricsSummary({ variant = 'default' }: { variant?: MetricsSummaryVariant }) {
  const { getLatestEntry, getProgressChange } = useMetrics();
  const latest = getLatestEntry();
  const isBrutalist = variant === 'brutalist';

  const shell = (children: ReactNode) => (
    <div
      className={cn(
        'border p-6 backdrop-blur-sm',
        isBrutalist
          ? 'rounded-none border-2 border-border bg-muted/30'
          : 'rounded-2xl border-secondary/20 bg-gradient-to-br from-card to-card/50',
      )}
    >
      {children}
    </div>
  );

  if (!latest) {
    return shell(
      <>
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              'bg-gradient-to-br from-secondary to-accent p-3 text-secondary-foreground',
              isBrutalist ? 'rounded-none' : 'rounded-xl',
            )}
          >
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className={cn('font-semibold text-foreground', isBrutalist && 'dm-display text-lg')}>Métricas</h3>
            <p className="text-xs text-muted-foreground">Aún no hay datos</p>
          </div>
        </div>
        <Link href="/metrics">
          <Button
            className={cn(
              'w-full text-sm',
              isBrutalist
                ? 'dm-label rounded-none bg-primary uppercase tracking-widest text-primary-foreground shadow-[4px_4px_0_0_var(--brand-cyan)] hover:brightness-110'
                : 'bg-gradient-to-r from-secondary to-accent text-accent-foreground hover:shadow-lg',
            )}
          >
            Agregar primera medición
          </Button>
        </Link>
      </>,
    );
  }

  const weight = latest.weight ? `${latest.weight.toFixed(1)} kg` : '—';
  const bodyFat =
    latest.bodyFat != null
      ? `${latest.bodyFat.toFixed(1)}%${latest.bodyFatSource === 'estimated' ? ' (est.)' : ''}`
      : '—';
  const muscleMass =
    latest.muscleMass != null
      ? `${latest.muscleMass.toFixed(1)} kg${latest.muscleMassSource === 'estimated' ? ' (est.)' : ''}`
      : '—';
  const bicepsPair =
    latest.bicepsLeft != null || latest.bicepsRight != null
      ? `${latest.bicepsLeft?.toFixed(1) ?? '—'} / ${latest.bicepsRight?.toFixed(1) ?? '—'} cm`
      : '—';
  const thighPair =
    latest.thighLeft != null || latest.thighRight != null
      ? `${latest.thighLeft?.toFixed(1) ?? '—'} / ${latest.thighRight?.toFixed(1) ?? '—'} cm`
      : '—';
  const calfPair =
    latest.calfLeft != null || latest.calfRight != null
      ? `${latest.calfLeft?.toFixed(1) ?? '—'} / ${latest.calfRight?.toFixed(1) ?? '—'} cm`
      : '—';

  const weightChange = getProgressChange('weight');
  const bodyFatChange = getProgressChange('bodyFat');
  const muscleMassChange = getProgressChange('muscleMass');

  return shell(
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'bg-gradient-to-br from-secondary to-accent p-3 text-secondary-foreground',
              isBrutalist ? 'rounded-none' : 'rounded-xl',
            )}
          >
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className={cn('font-semibold text-foreground', isBrutalist && 'dm-display text-lg')}>
              Métricas recientes
            </h3>
            <p className="text-xs text-muted-foreground">Última actualización</p>
          </div>
        </div>
        <Link href="/metrics">
          <button
            type="button"
            className={cn(
              'p-2 transition-colors',
              isBrutalist ? 'rounded-none hover:bg-muted' : 'rounded-lg hover:bg-secondary/10',
            )}
          >
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between border-b border-border pb-2">
          <span className={cn('text-sm text-muted-foreground', isBrutalist && 'dm-label text-[10px] font-bold uppercase')}>
            Peso
          </span>
          <div className="text-right">
            <span className={cn('font-semibold text-foreground', isBrutalist && 'dm-display text-lg')}>{weight}</span>
            {weightChange != null && (
              <span
                className={cn(
                  'ml-1 text-xs font-medium',
                  weightChange < 0 ? 'text-green-500' : 'text-red-500',
                )}
              >
                {weightChange < 0 ? '↓' : '↑'} {Math.abs(weightChange).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between border-b border-border pb-2">
          <span className={cn('text-sm text-muted-foreground', isBrutalist && 'dm-label text-[10px] font-bold uppercase')}>
            Grasa corporal
          </span>
          <div className="text-right">
            <span className={cn('font-semibold text-foreground', isBrutalist && 'dm-display text-lg')}>{bodyFat}</span>
            {bodyFatChange != null && (
              <span
                className={cn(
                  'ml-1 text-xs font-medium',
                  bodyFatChange < 0 ? 'text-green-500' : 'text-red-500',
                )}
              >
                {bodyFatChange < 0 ? '↓' : '↑'} {Math.abs(bodyFatChange).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between border-b border-border pb-2">
          <span className={cn('text-sm text-muted-foreground', isBrutalist && 'dm-label text-[10px] font-bold uppercase')}>
            Masa muscular
          </span>
          <div className="text-right">
            <span className={cn('font-semibold text-foreground', isBrutalist && 'dm-display text-lg')}>{muscleMass}</span>
            {muscleMassChange != null && (
              <span
                className={cn(
                  'ml-1 text-xs font-medium',
                  muscleMassChange > 0 ? 'text-green-500' : 'text-red-500',
                )}
              >
                {muscleMassChange > 0 ? '↑' : '↓'} {Math.abs(muscleMassChange).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between border-b border-border pb-2">
          <span className={cn('text-sm text-muted-foreground', isBrutalist && 'dm-label text-[10px] font-bold uppercase')}>
            Bíceps (izq/der)
          </span>
          <span className={cn('font-semibold text-foreground', isBrutalist && 'dm-display text-base')}>{bicepsPair}</span>
        </div>

        <div className="flex items-end justify-between border-b border-border pb-2">
          <span className={cn('text-sm text-muted-foreground', isBrutalist && 'dm-label text-[10px] font-bold uppercase')}>
            Muslos (izq/der)
          </span>
          <span className={cn('font-semibold text-foreground', isBrutalist && 'dm-display text-base')}>{thighPair}</span>
        </div>

        <div className="flex items-end justify-between border-b border-border pb-2">
          <span className={cn('text-sm text-muted-foreground', isBrutalist && 'dm-label text-[10px] font-bold uppercase')}>
            Pantorrillas (izq/der)
          </span>
          <span className={cn('font-semibold text-foreground', isBrutalist && 'dm-display text-base')}>{calfPair}</span>
        </div>
      </div>

      <Link href="/metrics" className="mt-4 block">
        <Button
          variant="outline"
          className={cn(
            'w-full border-secondary text-secondary hover:bg-secondary/10',
            isBrutalist &&
              'dm-label rounded-none border-2 text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary',
          )}
        >
          Ver todos los gráficos
        </Button>
      </Link>
    </>,
  );
}
