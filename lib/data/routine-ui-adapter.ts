import type { Routine as StoreRoutine } from '@/lib/data/types';

export type RoutineTask = {
  id: string;
  label: string;
  setsPlanned: number;
  repsTarget: string;
  restSeconds: number;
  technique: string;
  suggestedWeightsKg?: number[];
};

export type UiRoutine = {
  id: number;
  routineKey: string;
  storeId: string;
  name: string;
  duration: number;
  exercises: number;
  difficulty: string;
  description: string;
  tasks: RoutineTask[];
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  expert: 'Experto',
};

export function storeRoutineToUi(routine: StoreRoutine): UiRoutine {
  return {
    id: Number.parseInt(routine.id, 10) || Date.now(),
    storeId: routine.id,
    routineKey: routine.id,
    name: routine.name,
    duration: routine.duration,
    exercises: routine.exercises.length,
    difficulty: DIFFICULTY_LABELS[routine.difficulty] ?? routine.difficulty,
    description: routine.description,
    tasks: routine.exercises.map((ex) => ({
      id: ex.exerciseId,
      label: ex.exerciseName,
      setsPlanned: ex.sets,
      repsTarget: String(ex.reps),
      restSeconds: ex.rest,
      technique:
        ex.technique ??
        `Ejecuta ${ex.exerciseName} con control. Descansa ${ex.rest}s entre series.`,
      suggestedWeightsKg: ex.suggestedWeightsKg,
    })),
  };
}

export function totalPlannedSets(routine: UiRoutine): number {
  return routine.tasks.reduce((acc, t) => acc + t.setsPlanned, 0);
}

export function getSuggestedWeightForSet(task: RoutineTask, setNumber: number): number | undefined {
  const weights = task.suggestedWeightsKg;
  if (!weights?.length) return undefined;
  return weights[setNumber - 1] ?? weights[weights.length - 1];
}

export function taskUsesWeightLogging(task: RoutineTask): boolean {
  const weights = task.suggestedWeightsKg;
  if (weights?.some((w) => w > 0)) return true;
  return /^\d+(\.\d+)?$/.test(task.repsTarget.trim());
}
