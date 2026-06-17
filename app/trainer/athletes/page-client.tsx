'use client';

import { useState } from 'react';
import { AthletesList } from '@/components/trainer/athletes-list';
import { AthleteDetailModal } from '@/components/admin/athlete-detail-modal';
import { PrimeAthletePerformanceModal } from '@/components/admin-v2/prime-athlete-performance-modal';
import { useTrainer } from '@/hooks/use-trainer';
import type { AthleteProfile } from '@/hooks/use-admin';

export default function TrainerAthletesPage() {
  const { myAthletes, getActiveAssignmentForAthlete, getRoutineName } = useTrainer();
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [performanceAthlete, setPerformanceAthlete] = useState<AthleteProfile | null>(null);

  const getRoutineLabel = (athleteId: string) => {
    const assignment = getActiveAssignmentForAthlete(athleteId);
    return assignment ? getRoutineName(assignment.routineId) : 'Sin rutina';
  };

  return (
    <div className="space-y-8 px-8 py-12">
      <div>
        <h1 className="mb-2 text-5xl font-bold tracking-tight">Mis atletas</h1>
        <p className="text-lg text-muted-foreground">
          Atletas asignados a tu cuenta de entrenador
        </p>
      </div>
      <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-8 backdrop-blur-sm">
        <AthletesList
          athletes={myAthletes}
          getRoutineLabel={getRoutineLabel}
          onViewDetails={(a) => setSelectedAthlete(a)}
          onViewPerformance={(a) => setPerformanceAthlete(a)}
        />
      </div>
      <AthleteDetailModal
        athlete={selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        nutritionBasePath="/trainer/athletes"
      />
      <PrimeAthletePerformanceModal
        athlete={performanceAthlete}
        getRoutineName={getRoutineName}
        onClose={() => setPerformanceAthlete(null)}
      />
    </div>
  );
}
