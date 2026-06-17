'use client';

import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { MetricsOptionConservative } from '@/components/metrics/metrics-option-conservative';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useMetrics } from '@/hooks/use-metrics';

export default function MetricsPageClient() {
  const { isLoading, error } = useMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PrimePageHeader
          title="Mis Métricas"
          subtitle="Cargando tu historial de progreso…"
        />
        <LoadingState label="Cargando métricas…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PrimePageHeader title="Mis Métricas" subtitle="No se pudieron cargar los datos" />
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Mis Métricas"
        subtitle="Registra y revisa tu evolución: peso, grasa corporal, masa muscular, medidas y notas."
      />
      <MetricsOptionConservative />
    </div>
  );
}
