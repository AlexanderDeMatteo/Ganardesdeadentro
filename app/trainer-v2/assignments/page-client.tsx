'use client';

import { useMemo, useState, useEffect } from 'react';
import { PrimeKpiStrip } from '@/components/admin-v2/prime-kpi-strip';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { PrimeTrainerAssignRoutineModal } from '@/components/trainer-v2/prime-trainer-assign-routine-modal';
import { PrimeTrainerAssignmentBoard } from '@/components/trainer-v2/prime-trainer-assignment-board';
import { PrimeTrainerPlanSummary } from '@/components/trainer-v2/prime-trainer-plan-summary';
import { PrimeTrainerWeeklyPlan } from '@/components/trainer-v2/prime-trainer-weekly-plan';
import { useTrainer } from '@/hooks/use-trainer';
import type { AthleteProfile } from '@/hooks/use-admin';
import { AlertCircle, Link2, Users } from 'lucide-react';

export default function TrainerV2AssignmentsPageClient() {
  const {
    trainerId,
    myAthletes,
    routines,
    assignments,
    stats,
    athleteHasRoutine,
    getActiveWeeklyPlanForAthlete,
    getRoutineName,
    assignRoutineToAthlete,
    unassignRoutine,
    toggleAssignmentCompleted,
    refreshAthletes,
  } = useTrainer();
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [weeklyPlanAthleteId, setWeeklyPlanAthleteId] = useState(myAthletes[0]?.id ?? '');

  useEffect(() => {
    if (!weeklyPlanAthleteId && myAthletes[0]?.id) {
      setWeeklyPlanAthleteId(myAthletes[0].id);
    }
  }, [myAthletes, weeklyPlanAthleteId]);

  const athletesWithoutRoutine = useMemo(
    () => myAthletes.filter((athlete) => !athleteHasRoutine(athlete.id)),
    [myAthletes, athleteHasRoutine],
  );

  const weeklyPlanAthlete = useMemo(
    () => myAthletes.find((athlete) => athlete.id === weeklyPlanAthleteId) ?? null,
    [myAthletes, weeklyPlanAthleteId],
  );

  const handleEditInWeeklyPlan = () => {
    const element = document.getElementById('weekly-plan-athlete');
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (element instanceof HTMLElement) {
      element.focus();
    }
  };

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Asignaciones"
        subtitle="Asigna rutinas y planes semanales a cada atleta"
      />

      <PrimeKpiStrip
        items={[
          { label: 'Mis atletas', value: myAthletes.length, icon: Users },
          { label: 'Asignaciones activas', value: stats.activeAssignments, icon: Link2 },
          {
            label: 'Sin rutina',
            value: athletesWithoutRoutine.length,
            icon: AlertCircle,
            layout: athletesWithoutRoutine.length > 0 ? 'critical' : 'satellite',
          },
        ]}
      />

      <PrimeTrainerWeeklyPlan
        athletes={myAthletes}
        routines={routines}
        trainerId={trainerId}
        selectedAthleteId={weeklyPlanAthleteId}
        onSelectedAthleteChange={setWeeklyPlanAthleteId}
        onPlanSaved={refreshAthletes}
      />

      <PrimeTrainerPlanSummary
        athleteId={weeklyPlanAthleteId}
        athleteName={weeklyPlanAthlete?.name}
        weeklyPlan={weeklyPlanAthleteId ? getActiveWeeklyPlanForAthlete(weeklyPlanAthleteId) : null}
        getRoutineName={getRoutineName}
        onEditInWeeklyPlan={handleEditInWeeklyPlan}
      />

      <PrimeTrainerAssignmentBoard
        athletes={myAthletes}
        assignments={assignments}
        getRoutineName={getRoutineName}
        onUnassign={unassignRoutine}
        onToggleComplete={toggleAssignmentCompleted}
        onAssignClick={(athlete) => setSelectedAthlete(athlete)}
      />

      <PrimeTrainerAssignRoutineModal
        athlete={selectedAthlete}
        routines={routines}
        onAssign={assignRoutineToAthlete}
        onClose={() => setSelectedAthlete(null)}
      />
    </div>
  );
}
