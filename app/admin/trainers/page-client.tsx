'use client';

import { TrainersList } from '@/components/admin/trainers-list';
import { useAdmin } from '@/hooks/use-admin';

export default function TrainersPage() {
  const { trainers } = useAdmin();

  return (
    <div className="px-8 py-12 space-y-8">
      <div>
        <h1 className="text-5xl font-bold tracking-tight mb-2">Gestión de Entrenadores</h1>
        <p className="text-lg text-muted-foreground">
          Visualiza los entrenadores disponibles, su especialización y carga de trabajo
        </p>
      </div>

      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Entrenadores</p>
            <p className="text-4xl font-bold text-primary">{trainers.length}</p>
          </div>

          <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Atletas Asignados</p>
            <p className="text-4xl font-bold text-secondary">
              {trainers.reduce((sum, t) => sum + t.athletes, 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Rating Promedio</p>
            <p className="text-4xl font-bold text-accent">
              {(trainers.reduce((sum, t) => sum + t.rating, 0) / trainers.length).toFixed(1)}
            </p>
          </div>
        </div>

        <TrainersList trainers={trainers} />
      </div>
    </div>
  );
}
