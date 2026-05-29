'use client';

import { useState, useEffect } from 'react';
import { AthleteProfile } from '@/hooks/use-admin';
import { BarChart3, Scale, Percent } from 'lucide-react';

interface ProgressOverviewProps {
  athletes: AthleteProfile[];
}

export function ProgressOverview({ athletes }: ProgressOverviewProps) {
  const [selectedId, setSelectedId] = useState(athletes[0]?.id ?? '');
  const selected = athletes.find((a) => a.id === selectedId) ?? athletes[0];

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

          {selected.metrics ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Peso</p>
                </div>
                <p className="text-3xl font-black text-primary">{selected.metrics.weight} kg</p>
              </div>
              <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-secondary" />
                  <p className="text-sm text-muted-foreground">Grasa corporal</p>
                </div>
                <p className="text-3xl font-black text-secondary">{selected.metrics.bodyFat}%</p>
              </div>
              <div className="rounded-xl border border-accent/20 bg-accent/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  <p className="text-sm text-muted-foreground">Masa muscular</p>
                </div>
                <p className="text-3xl font-black text-accent">{selected.metrics.muscleMass} kg</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Sin métricas registradas para este atleta</p>
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
                  {athletes.map((a) => (
                    <tr key={a.id} className="border-b border-secondary/10">
                      <td className="py-3 pr-4 font-medium">{a.name}</td>
                      <td className="py-3 pr-4">{a.metrics?.weight ?? '—'} kg</td>
                      <td className="py-3 pr-4">{a.metrics?.bodyFat ?? '—'}%</td>
                      <td className="py-3">{a.metrics?.muscleMass ?? '—'} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
