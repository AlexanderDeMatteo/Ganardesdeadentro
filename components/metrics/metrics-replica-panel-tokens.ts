import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

/** Fondo de paneles en área atleta Prime (alineado con gainer-prime-theme). */
export const METRICS_REPLICA_PANEL_BG = 'var(--gp-surface-high)';

export const metricsReplicaPanelSurfaceStyle: CSSProperties = {
  background: METRICS_REPLICA_PANEL_BG,
};

export function metricsReplicaChartPanelClassName(options?: { textWhite?: boolean }) {
  return cn(
    'gp-module gp-module-corner p-4 sm:p-6 lg:col-span-8',
    options?.textWhite && 'gp-text-primary',
  );
}
