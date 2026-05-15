'use client';

import { MetricsForm } from '@/components/metrics/metrics-form';
import { MetricsOptionOneDesignReplica } from '@/components/metrics/metrics-option-one-design-replica';

export function MetricsOptionConservative() {
  return (
    <div className="space-y-10">
      <MetricsOptionOneDesignReplica />

      <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-3 text-center text-xs text-muted-foreground">
        Registro de mediciones (funcional). La maqueta de arriba es réplica visual; los datos reales se guardan aquí.
      </div>

      <MetricsForm variant="default" idPrefix="opt1-" />
    </div>
  );
}
