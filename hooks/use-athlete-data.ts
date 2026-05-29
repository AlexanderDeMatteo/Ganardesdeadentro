'use client';

import { useAuth } from '@/app/context/auth-context';
import { useDataStore } from '@/lib/data/store';
import {
  getAthleteMetrics,
  getAthleteSessionLogs,
  getMealPlan,
  getMembership,
  getMyRoutine,
  getMyTrainer,
  getSessionLogsForWeek,
  getWeeklyPlan,
} from '@/lib/data/client';
import { resolveAthleteId } from '@/lib/nutrition/resolve-athlete-id';
import { getMondayOfWeek } from '@/lib/workout/session-utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AssignedNutritionPlan } from '@/lib/nutrition/types';
import type {
  Metric,
  Routine,
  RoutineAssignment,
  SessionLog,
  Trainer,
  WeeklyPlan,
} from '@/lib/data/types';

export function useAthleteData() {
  const { user } = useAuth();
  const { state, isHydrated } = useDataStore();
  const athleteId = useMemo(() => resolveAthleteId(user), [user]);

  const [activeAssignment, setActiveAssignment] = useState<RoutineAssignment | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [weekSessionLogs, setWeekSessionLogs] = useState<SessionLog[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [mealPlan, setMealPlan] = useState<AssignedNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStartDate = useMemo(() => getMondayOfWeek(), []);

  const athlete = useMemo(
    () => (athleteId ? state.athletes.find((a) => a.id === athleteId) ?? null : null),
    [state.athletes, athleteId],
  );

  const refresh = useCallback(async () => {
    if (!athleteId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [routineResult, athleteMetrics, logs, assignedTrainer, plan, weekPlanData, weekLogs] =
        await Promise.all([
          getMyRoutine(athleteId),
          getAthleteMetrics(athleteId),
          getAthleteSessionLogs(athleteId),
          getMyTrainer(athleteId),
          getMealPlan(athleteId),
          getWeeklyPlan(athleteId),
          getSessionLogsForWeek(athleteId, weekStartDate),
        ]);
      setActiveAssignment(routineResult?.assignment ?? null);
      setActiveRoutine(routineResult?.routine ?? null);
      setMetrics(athleteMetrics);
      setSessionLogs(logs);
      setTrainer(assignedTrainer);
      setMealPlan(plan);
      setWeeklyPlan(weekPlanData);
      setWeekSessionLogs(weekLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del atleta');
    } finally {
      setIsLoading(false);
    }
  }, [athleteId, weekStartDate]);

  useEffect(() => {
    if (!isHydrated) return;
    void refresh();
  }, [
    isHydrated,
    refresh,
    state.assignments,
    state.routines,
    state.metrics,
    state.sessionLogs,
    state.weeklyPlans,
  ]);

  const completedSessionsCount = sessionLogs.filter(
    (s) => s.sessionOutcome === 'completed' || s.completed,
  ).length;
  const weekCompletedCount = weekSessionLogs.filter(
    (s) => s.sessionOutcome === 'completed' || s.completed,
  ).length;
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const latestSession = sessionLogs[0] ?? null;

  return {
    athleteId,
    athlete,
    user,
    activeAssignment,
    activeRoutine,
    weeklyPlan,
    weekSessionLogs,
    weekStartDate,
    weekCompletedCount,
    metrics,
    sessionLogs,
    latestSession,
    trainer,
    mealPlan,
    completedSessionsCount,
    latestMetric,
    isLoading: !isHydrated || isLoading,
    isHydrated,
    error,
    refresh,
    getMembership: () => (athleteId ? getMembership(athleteId) : Promise.resolve(null)),
  };
}
