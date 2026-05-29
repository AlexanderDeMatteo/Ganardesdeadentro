'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { MetricsOptionConservative } from '@/components/metrics/metrics-option-conservative';
import { Navbar } from '@/components/layout/navbar';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useMetrics } from '@/hooks/use-metrics';

function MetricsContent() {
  const { isLoading, error } = useMetrics();

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <LoadingState label="Cargando métricas…" />
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <ErrorState message={error} />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="brand-shell min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-3">
            <p className="brand-kicker">Tracker de progreso</p>
            <h1 className="brand-title text-5xl font-black">Mis Métricas</h1>
            <p className="text-lg text-muted-foreground">Sigue tu progreso y visualiza tu transformación</p>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Registra y revisa tu evolución: peso, grasa corporal (manual o estimada desde perfil), masa muscular,
              medidas y notas.
            </p>
          </div>

          <MetricsOptionConservative />
        </div>
      </main>
    </>
  );
}

export default function MetricsPage() {
  return (
    <ProtectedRoute>
      <MetricsContent />
    </ProtectedRoute>
  );
}
