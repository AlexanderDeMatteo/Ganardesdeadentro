'use client';

import { useState } from 'react';
import { AssignmentBoard } from '@/components/trainer/assignment-board';
import { AssignRoutineModal } from '@/components/trainer/assign-routine-modal';
import { WeeklyPlanEditor } from '@/components/trainer/weekly-plan-editor';
import { useTrainer } from '@/hooks/use-trainer';
import type { AthleteProfile } from '@/hooks/use-admin';

export default function TrainerAssignmentsPage() {
  const {
    trainerId,
    myAthletes,
    routines,
    assignments,
    getRoutineName,
    assignRoutineToAthlete,
    unassignRoutine,
    toggleAssignmentCompleted,
  } = useTrainer();
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);

  return (
    <div className="space-y-8 px-8 py-12">
      <div>
        <h1 className="mb-2 text-5xl font-bold tracking-tight">Asignaciones</h1>
        <p className="text-lg text-muted-foreground">
          Asigna rutinas a cada uno de tus atletas
        </p>
      </div>
      <WeeklyPlanEditor athletes={myAthletes} routines={routines} trainerId={trainerId} />
      <AssignmentBoard
        athletes={myAthletes}
        assignments={assignments}
        getRoutineName={getRoutineName}
        onUnassign={unassignRoutine}
        onToggleComplete={toggleAssignmentCompleted}
        onAssignClick={(a) => setSelectedAthlete(a)}
      />
      <AssignRoutineModal
        athlete={selectedAthlete}
        routines={routines}
        onAssign={assignRoutineToAthlete}
        onClose={() => setSelectedAthlete(null)}
      />
    </div>
  );
}
