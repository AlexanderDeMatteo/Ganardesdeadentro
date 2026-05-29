import type { SetLogEntry } from '@/lib/data/types';
import { workoutSetResultKey } from '@/lib/workout/session-utils';

export type ExerciseReviewStatus = 'excelente' | 'fallo' | 'ajuste' | 'pendiente';

export type ExerciseReviewItem = {
  label: string;
  status: ExerciseReviewStatus;
  completedSets: number;
  failedSets: number;
  plannedSets: number;
  failedSetDetails?: Array<{ setNumber: number; repsLogged: string; weightKg?: number }>;
  bestWeightKg?: number;
  suggestedWeightKg?: number;
};

export type RoutineTaskForReview = {
  id: string;
  label: string;
  setsPlanned: number;
};

function deriveStatus(
  task: RoutineTaskForReview,
  completedSets: number,
  failedSets: number,
): ExerciseReviewStatus {
  const recorded = completedSets + failedSets;
  if (recorded === 0) return 'pendiente';
  if (failedSets >= 2) return 'fallo';
  if (failedSets === 1) return 'ajuste';
  if (task.setsPlanned > 0 && completedSets === task.setsPlanned) return 'excelente';
  return 'pendiente';
}

export function buildExerciseReviewItems(
  tasks: RoutineTaskForReview[],
  results: Record<string, 'completed' | 'failed'>,
): ExerciseReviewItem[] {
  const items: ExerciseReviewItem[] = [];

  for (const task of tasks) {
    let completedSets = 0;
    let failedSets = 0;
    for (let s = 1; s <= task.setsPlanned; s++) {
      const v = results[workoutSetResultKey(task.id, s)];
      if (v === 'completed') completedSets++;
      else if (v === 'failed') failedSets++;
    }

    const recorded = completedSets + failedSets;
    if (recorded === 0) continue;

    items.push({
      label: task.label,
      status: deriveStatus(task, completedSets, failedSets),
      completedSets,
      failedSets,
      plannedSets: task.setsPlanned,
    });
  }

  return items;
}

export function buildExerciseReviewItemsFromSetLogs(
  tasks: RoutineTaskForReview[],
  setLogs: SetLogEntry[],
): ExerciseReviewItem[] {
  const items: ExerciseReviewItem[] = [];

  for (const task of tasks) {
    const taskLogs = setLogs.filter((l) => l.exerciseId === task.id);
    if (taskLogs.length === 0) continue;

    let completedSets = 0;
    let failedSets = 0;
    const failedSetDetails: ExerciseReviewItem['failedSetDetails'] = [];
    const weights: number[] = [];
    const suggested: number[] = [];

    for (const log of taskLogs) {
      if (log.result === 'completed') completedSets++;
      else if (log.result === 'failed') {
        failedSets++;
        failedSetDetails.push({
          setNumber: log.setNumber,
          repsLogged: log.repsLogged ?? log.repsTarget,
          weightKg: log.weightKg,
        });
      }
      if (log.weightKg != null && log.weightKg > 0) weights.push(log.weightKg);
      if (log.suggestedWeightKg != null && log.suggestedWeightKg > 0) {
        suggested.push(log.suggestedWeightKg);
      }
    }

    items.push({
      label: task.label,
      status: deriveStatus(task, completedSets, failedSets),
      completedSets,
      failedSets,
      plannedSets: task.setsPlanned,
      failedSetDetails: failedSetDetails.length > 0 ? failedSetDetails : undefined,
      bestWeightKg: weights.length > 0 ? Math.max(...weights) : undefined,
      suggestedWeightKg: suggested.length > 0 ? suggested[suggested.length - 1] : undefined,
    });
  }

  return items;
}
