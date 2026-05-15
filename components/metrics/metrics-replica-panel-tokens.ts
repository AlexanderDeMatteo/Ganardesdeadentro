import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

/** Fondo de paneles oscuros estilo réplica FITTRACK (métricas, KPIs). */
export const METRICS_REPLICA_PANEL_BG = 'rgba(15, 17, 20, 0.92)';

export const metricsReplicaPanelSurfaceStyle: CSSProperties = {
  background: METRICS_REPLICA_PANEL_BG,
};

/**
 * Contenedor del gráfico principal (panel de métrica destacada en `MetricsOptionOneDesignReplica`).
 */
export function metricsReplicaChartPanelClassName(options?: { textWhite?: boolean }) {
  return cn(
    'rounded-2xl border border-white/[0.08] p-4 sm:p-6 lg:col-span-8',
    options?.textWhite && 'text-white',
  );
}
