'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { MetricsForm } from '@/components/metrics/metrics-form';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { useMetrics } from '@/hooks/use-metrics';
import { TrendingUp, TrendingDown, ArrowRight, Weight } from 'lucide-react';

function MetricsContent() {
  const { getLatestEntry, getProgressChange, isLoading } = useMetrics();
  const latest = getLatestEntry();

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <p className="text-muted-foreground">Cargando métricas...</p>
          </div>
        </main>
      </>
    );
  }

  const getMetricDisplay = (key: 'weight' | 'bodyFat' | 'muscleMass', unit: string) => {
    const change = getProgressChange(key);
    if (!latest || latest[key] === undefined) {
      return { value: '—', change: null, isPositive: false };
    }

    const isPositive = (key === 'weight' || key === 'bodyFat') ? (change! < 0) : (change! > 0);

    return {
      value: `${latest[key]!.toFixed(1)} ${unit}`,
      change: change ? Math.abs(change).toFixed(1) : null,
      isPositive,
    };
  };

  const weight = getMetricDisplay('weight', 'kg');
  const bodyFat = getMetricDisplay('bodyFat', '%');
  const muscleMass = getMetricDisplay('muscleMass', 'kg');

  const stats = [
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
      value: bodyFat.value,
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

  return (
    <>
      <Navbar />
      <main className="brand-shell min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 space-y-2">
            <p className="brand-kicker">Tracker de progreso</p>
            <h1 className="brand-title text-5xl font-black">Mis Métricas</h1>
            <p className="text-lg text-muted-foreground">
              Sigue tu progreso y visualiza tu transformación
            </p>
          </div>

          {/* Metrics Form */}
          <MetricsForm />

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="group brand-card brand-card-hover rounded-2xl p-8"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">{stat.label}</p>
                  <p className="text-3xl font-black text-foreground mb-3">{stat.value}</p>

                  {stat.change && (
                    <div className="flex items-center gap-2">
                      {stat.isPositive ? (
                        <span className="text-sm font-semibold text-green-500 flex items-center gap-1">
                          <ArrowRight className="h-4 w-4 rotate-45" />
                          +{stat.change}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-red-500 flex items-center gap-1">
                          <ArrowRight className="h-4 w-4 -rotate-45" />
                          -{stat.change}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Charts Grid */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Gráficos de Progreso</h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <MetricsChart
                title="Progreso de Peso"
                metric="weight"
                unit="kg"
                color="var(--primary)"
              />
              <MetricsChart
                title="Grasa Corporal"
                metric="bodyFat"
                unit="%"
                color="var(--destructive)"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <MetricsChart
                title="Masa Muscular"
                metric="muscleMass"
                unit="kg"
                color="var(--chart-3)"
              />
              <MetricsChart
                title="Cintura"
                metric="waist"
                unit="cm"
                color="var(--secondary)"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <MetricsChart
                title="Bíceps"
                metric="biceps"
                unit="cm"
                color="var(--chart-1)"
              />
              <MetricsChart
                title="Pecho"
                metric="chest"
                unit="cm"
                color="var(--primary)"
              />
              <MetricsChart
                title="Muslos"
                metric="thighs"
                unit="cm"
                color="var(--chart-2)"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <MetricsChart
                title="Cadera"
                metric="hips"
                unit="cm"
                color="var(--chart-4)"
              />
              <MetricsChart
                title="Pantorrillas"
                metric="calves"
                unit="cm"
                color="var(--chart-5)"
              />
            </div>
          </div>
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
