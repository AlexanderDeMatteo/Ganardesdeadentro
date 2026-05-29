'use client';

import { ProgressOverview } from '@/components/trainer/progress-overview';
import { useTrainer } from '@/hooks/use-trainer';

export default function TrainerProgressPage() {
  const { myAthletes } = useTrainer();

  return (
    <div className="space-y-8 px-8 py-12">
      <div>
        <h1 className="mb-2 text-5xl font-bold tracking-tight">Progreso</h1>
        <p className="text-lg text-muted-foreground">
          Seguimiento de métricas de tus atletas asignados
        </p>
      </div>
      <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-8">
        <ProgressOverview athletes={myAthletes} />
      </div>
    </div>
  );
}
