import type { SessionLog, SetLogEntry, SetResult } from '@/lib/data/types';

export function workoutSetResultKey(exerciseId: string, setNumber: number): string {
  return `${exerciseId}:${setNumber}`;
}

export type SetDraft = {
  reps: string;
  weightKg: string;
};

export function countSetResults(setLogs: SetLogEntry[]): {
  completedSets: number;
  failedSets: number;
  totalRecorded: number;
} {
  let completedSets = 0;
  let failedSets = 0;
  for (const log of setLogs) {
    if (log.result === 'completed') completedSets++;
    else if (log.result === 'failed') failedSets++;
  }
  return { completedSets, failedSets, totalRecorded: completedSets + failedSets };
}

export function deriveSessionOutcome(
  completedSets: number,
  failedSets: number,
  totalSets: number,
): 'completed' | 'abandoned' {
  if (totalSets <= 0) return 'abandoned';
  const strictDone = failedSets === 0 && completedSets === totalSets;
  if (strictDone) return 'completed';
  const pct = (completedSets / totalSets) * 100;
  return pct >= 80 && failedSets === 0 ? 'completed' : 'abandoned';
}

export function setLogsToResultMap(setLogs: SetLogEntry[]): Record<string, SetResult> {
  const out: Record<string, SetResult> = {};
  for (const log of setLogs) {
    if (log.result === 'completed' || log.result === 'failed') {
      out[workoutSetResultKey(log.exerciseId, log.setNumber)] = log.result;
    }
  }
  return out;
}

export function getLastWeightForExercise(
  sessionLogs: SessionLog[],
  exerciseId: string,
): number | undefined {
  for (let i = sessionLogs.length - 1; i >= 0; i--) {
    const logs = sessionLogs[i].setLogs ?? [];
    for (let j = logs.length - 1; j >= 0; j--) {
      const entry = logs[j];
      if (entry.exerciseId === exerciseId && entry.weightKg != null && entry.weightKg > 0) {
        return entry.weightKg;
      }
    }
  }
  return undefined;
}

export function getMondayOfWeek(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function getScheduledDateForDayIndex(weekStartDate: string, dayIndex: number): string {
  const d = new Date(weekStartDate + 'T12:00:00');
  d.setDate(d.getDate() + dayIndex);
  return d.toISOString().split('T')[0];
}

export function weightLoadIndicator(
  usedKg: number | undefined,
  suggestedKg: number | undefined,
): 'neutral' | 'good' | 'warning' | 'danger' {
  if (usedKg == null || suggestedKg == null || suggestedKg <= 0) return 'neutral';
  const diffPct = Math.abs(usedKg - suggestedKg) / suggestedKg;
  if (diffPct <= 0.1) return 'good';
  if (diffPct <= 0.2) return 'warning';
  return 'danger';
}
