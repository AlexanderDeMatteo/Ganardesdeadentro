import type { RoutineAssignment, WeeklyPlan } from '@/lib/data/types';

export type AthleteRoutineSummary = {
  source: 'weeklyPlan' | 'direct' | 'none';
  shortLabel: string;
  detailLabel: string;
  trainingDaysCount: number;
};

export function getAthleteRoutineSummary(
  athleteId: string,
  weeklyPlan: WeeklyPlan | null,
  activeAssignment: RoutineAssignment | null,
  getRoutineName: (id: string) => string,
): AthleteRoutineSummary {
  void athleteId;

  if (weeklyPlan?.isActive && weeklyPlan.days.length > 0) {
    const trainingDays = weeklyPlan.days.filter((day) => day.routineId);
    const dayDetails = trainingDays.map(
      (day) => `${day.label}: ${getRoutineName(day.routineId!)}`,
    );
    const detailLabel =
      dayDetails.length > 0
        ? `${dayDetails.join(' · ')} · ${trainingDays.length} días/sem`
        : 'Plan semanal sin días de entrenamiento';

    return {
      source: 'weeklyPlan',
      shortLabel: 'Plan semanal',
      detailLabel,
      trainingDaysCount: trainingDays.length,
    };
  }

  if (activeAssignment?.isActive) {
    const name = getRoutineName(activeAssignment.routineId);
    return {
      source: 'direct',
      shortLabel: name,
      detailLabel: `Asignación directa: ${name}`,
      trainingDaysCount: 0,
    };
  }

  return {
    source: 'none',
    shortLabel: 'Sin rutina',
    detailLabel: 'Sin plan semanal ni asignación directa activa',
    trainingDaysCount: 0,
  };
}

export function athleteHasActiveRoutine(
  weeklyPlan: WeeklyPlan | null,
  activeAssignment: RoutineAssignment | null,
): boolean {
  if (weeklyPlan?.isActive && weeklyPlan.days.some((day) => day.routineId)) {
    return true;
  }
  return Boolean(activeAssignment?.isActive);
}
