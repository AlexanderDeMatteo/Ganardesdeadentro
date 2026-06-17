'use client';

import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { PrimeTrainerProgress } from '@/components/trainer-v2/prime-trainer-progress';
import { useTrainer } from '@/hooks/use-trainer';

export default function TrainerV2ProgressPageClient() {
  const { myAthletes } = useTrainer();

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Progreso"
        subtitle="Seguimiento de métricas de tus atletas asignados"
      />
      <PrimeTrainerProgress athletes={myAthletes} />
    </div>
  );
}
