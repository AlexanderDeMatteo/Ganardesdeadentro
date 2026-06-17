'use client';

import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { AssignedRoutineView } from '@/components/routines/assigned-routine-view';

export default function RoutinesPageClient() {
  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Mis Rutinas"
        subtitle="Rutina asignada por tu entrenador. Marca series y registra tu progreso."
      />
      <AssignedRoutineView />
    </div>
  );
}
