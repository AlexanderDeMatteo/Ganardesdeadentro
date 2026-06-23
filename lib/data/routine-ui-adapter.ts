import type {
  Routine as StoreRoutine,
  RoutineExerciseBlockConfig,
  RoutineStructureType,
} from '@/lib/data/types';

export type RoutineTask = {
  id: string;
  label: string;
  setsPlanned: number;
  repsTarget: string;
  restSeconds: number;
  technique: string;
  suggestedWeightsKg?: number[];
  blockConfig?: RoutineExerciseBlockConfig;
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
  structureType: RoutineStructureType;
  tasks: RoutineTask[];
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  expert: 'Experto',
};

export function storeRoutineToUi(routine: StoreRoutine): UiRoutine {
  const structureType = routine.structureType ?? 'standard';
  return {
    id: Number.parseInt(routine.id, 10) || Date.now(),
    storeId: routine.id,
    routineKey: routine.id,
    name: routine.name,
    duration: routine.duration,
    exercises: routine.exercises.length,
    difficulty: DIFFICULTY_LABELS[routine.difficulty] ?? routine.difficulty,
    description: routine.description,
    structureType,
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
      blockConfig: ex.blockConfig,
    })),
  };
}

export function totalPlannedSets(routine: UiRoutine): number {
  if (routine.structureType === 'series_pull' || routine.structureType === 'superset') {
    return routine.tasks.reduce((acc, task) => acc + task.setsPlanned, 0);
  }
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

export function isCompoundSetTask(task: RoutineTask, structureType: RoutineStructureType): boolean {
  if (structureType === 'series_pull') {
    return Boolean(task.blockConfig?.romRanges?.length);
  }
  if (structureType === 'superset') {
    return Boolean(task.blockConfig?.steps?.length);
  }
  return false;
}
