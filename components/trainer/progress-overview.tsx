'use client';

import { useState, useEffect } from 'react';
import { AthleteProfile } from '@/hooks/use-admin';
import { useAthleteMetrics } from '@/hooks/use-athlete-metrics';
import { AthleteMetricsChart } from '@/components/metrics/athlete-metrics-chart';
import { LoadingState } from '@/components/ui/loading-state';
import { BarChart3, Scale, Percent } from 'lucide-react';

interface ProgressOverviewProps {
  athletes: AthleteProfile[];
}

function displayMetric(athlete: AthleteProfile) {
  return athlete.latestMetric ?? athlete.metrics ?? null;
}

export function ProgressOverview({ athletes }: ProgressOverviewProps) {
  const [selectedId, setSelectedId] = useState(athletes[0]?.id ?? '');
  const selected = athletes.find((a) => a.id === selectedId) ?? athletes[0];
  const { latest, isLoading, error, getChartData } = useAthleteMetrics(selected?.id);

  useEffect(() => {
    if (athletes.length > 0 && !athletes.some((a) => a.id === selectedId)) {
      setSelectedId(athletes[0].id);
    }
  }, [athletes, selectedId]);

  if (athletes.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No hay atletas asignados para mostrar progreso
      </p>
    );
  }

  const summary = latest ?? (selected ? displayMetric(selected) : null);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {athletes.map((athlete) => (
          <button
            key={athlete.id}
            type="button"
            onClick={() => setSelectedId(athlete.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              selectedId === athlete.id
                ? 'bg-primary text-primary-foreground'
                : 'border border-secondary/30 bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {athlete.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black">{selected.name}</h2>
            <p className="text-muted-foreground">{selected.email}</p>
          </div>

          {isLoading ? (
            <LoadingState label="Cargando métricas del atleta…" />
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : summary ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Peso</p>
                </div>
                <p className="text-3xl font-black text-primary">{summary.weight} kg</p>
              </div>
              <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-secondary" />
                  <p className="text-sm text-muted-foreground">Grasa corporal</p>
                </div>
                <p className="text-3xl font-black text-secondary">{summary.bodyFat}%</p>
              </div>
              <div className="rounded-xl border border-accent/20 bg-accent/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  <p className="text-sm text-muted-foreground">Masa muscular</p>
                </div>
                <p className="text-3xl font-black text-accent">{summary.muscleMass} kg</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Sin métricas registradas para este atleta</p>
          )}

          {!isLoading && !error && (
            <div className="grid gap-4 lg:grid-cols-2">
              <AthleteMetricsChart
                title="Evolución peso"
                data={getChartData('weight')}
                unit="kg"
                color="hsl(var(--primary))"
              />
              <AthleteMetricsChart
                title="Evolución grasa corporal"
                data={getChartData('bodyFat')}
                unit="%"
                color="hsl(var(--secondary))"
              />
            </div>
          )}

          <div className="rounded-xl border border-secondary/20 bg-card/50 p-6">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Comparativa del equipo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary/20 text-left">
                    <th className="pb-2 pr-4">Atleta</th>
                    <th className="pb-2 pr-4">Peso</th>
                    <th className="pb-2 pr-4">Grasa %</th>
                    <th className="pb-2">Masa muscular</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map((a) => {
                    const m = displayMetric(a);
                    return (
                      <tr key={a.id} className="border-b border-secondary/10">
                        <td className="py-3 pr-4 font-medium">{a.name}</td>
                        <td className="py-3 pr-4">{m?.weight ?? '—'} kg</td>
                        <td className="py-3 pr-4">{m?.bodyFat ?? '—'}%</td>
                        <td className="py-3">{m?.muscleMass ?? '—'} kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
