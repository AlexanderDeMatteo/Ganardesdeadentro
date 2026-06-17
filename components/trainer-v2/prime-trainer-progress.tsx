'use client';

import { useState, useEffect, useMemo } from 'react';
import { AthleteProfile } from '@/hooks/use-admin';
import { useAthleteMetrics } from '@/hooks/use-athlete-metrics';
import { PrimeFilterPills } from '@/components/admin-v2/prime-filter-pills';
import { PrimeKpiCard } from '@/components/admin-v2/prime-kpi-card';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePerformanceChart } from '@/components/admin-v2/prime-performance-chart';
import { LoadingState } from '@/components/ui/loading-state';
import { BarChart3, Percent, Scale } from 'lucide-react';

interface PrimeTrainerProgressProps {
  athletes: AthleteProfile[];
}

function displayMetric(athlete: AthleteProfile) {
  return athlete.latestMetric ?? athlete.metrics ?? null;
}

export function PrimeTrainerProgress({ athletes }: PrimeTrainerProgressProps) {
  const [selectedId, setSelectedId] = useState(athletes[0]?.id ?? '');
  const selected = athletes.find((a) => a.id === selectedId) ?? athletes[0];
  const { latest, isLoading, error, getChartData } = useAthleteMetrics(selected?.id);

  useEffect(() => {
    if (athletes.length > 0 && !athletes.some((a) => a.id === selectedId)) {
      setSelectedId(athletes[0].id);
    }
  }, [athletes, selectedId]);

  const athleteFilters = useMemo(
    () =>
      athletes.map((a) => ({
        key: a.id,
        label: a.name.split(' ')[0] ?? a.name,
      })),
    [athletes],
  );

  if (athletes.length === 0) {
    return (
      <PrimeModule modId="TRN-40" title="PROGRESO">
        <p className="gp-mono py-12 text-center text-sm gp-text-muted">
          No hay atletas asignados para mostrar progreso
        </p>
      </PrimeModule>
    );
  }

  const summary = latest ?? (selected ? displayMetric(selected) : null);

  return (
    <div className="space-y-6">
      <PrimeModule modId="TRN-40" title="SELECTOR_ATLETA">
        <div className="p-4 sm:p-5">
          <PrimeFilterPills
            filters={athleteFilters}
            active={selectedId}
            onChange={setSelectedId}
          />
        </div>
      </PrimeModule>

      {selected && (
        <>
          <div>
            <h2 className="gp-display text-2xl gp-text-primary">{selected.name}</h2>
            <p className="gp-mono text-sm gp-text-muted">{selected.email}</p>
          </div>

          {isLoading ? (
            <LoadingState label="Cargando métricas del atleta…" />
          ) : error ? (
            <p className="gp-mono text-sm text-[#ffb4ab]">{error}</p>
          ) : summary ? (
            <div className="grid gap-4 md:grid-cols-3">
              <PrimeKpiCard label="Peso" value={`${summary.weight} kg`} icon={Scale} />
              <PrimeKpiCard label="Grasa corporal" value={`${summary.bodyFat}%`} icon={Percent} />
              <PrimeKpiCard
                label="Masa muscular"
                value={`${summary.muscleMass} kg`}
                icon={BarChart3}
              />
            </div>
          ) : (
            <p className="gp-mono text-sm gp-text-muted">
              Sin métricas registradas para este atleta
            </p>
          )}

          {!isLoading && !error && (
            <div className="grid gap-4 lg:grid-cols-2">
              <PrimePerformanceChart
                title="Evolución peso"
                data={getChartData('weight')}
                unit="kg"
                color="#68ca62"
              />
              <PrimePerformanceChart
                title="Evolución grasa corporal"
                data={getChartData('bodyFat')}
                unit="%"
                color="#83e77b"
              />
            </div>
          )}

          <PrimeModule modId="TRN-43" title="COMPARATIVA_EQUIPO">
            <div className="overflow-x-auto p-4 sm:p-5">
              <table className="w-full text-sm" aria-label="Comparativa del equipo">
                <caption className="sr-only">Métricas comparativas de atletas asignados</caption>
                <thead>
                  <tr className="gp-mono border-b gp-border-outline text-left text-xs uppercase gp-text-muted">
                    <th scope="col" className="pb-2 pr-4">Atleta</th>
                    <th scope="col" className="pb-2 pr-4">Peso</th>
                    <th scope="col" className="pb-2 pr-4">Grasa %</th>
                    <th scope="col" className="pb-2">Masa muscular</th>
                  </tr>
                </thead>
                <tbody className="gp-mono">
                  {athletes.map((a) => {
                    const m = displayMetric(a);
                    return (
                      <tr key={a.id} className="border-b gp-border-outline/20">
                        <td className="py-3 pr-4 font-medium gp-text-primary">{a.name}</td>
                        <td className="gp-metric py-3 pr-4">{m?.weight ?? '—'} kg</td>
                        <td className="gp-metric py-3 pr-4">{m?.bodyFat ?? '—'}%</td>
                        <td className="gp-metric py-3">{m?.muscleMass ?? '—'} kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PrimeModule>
        </>
      )}
    </div>
  );
}
