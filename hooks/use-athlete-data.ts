'use client';

import { useAuth } from '@/app/context/auth-context';
import { isApiRoutinesSource, isApiUsersSource } from '@/lib/api/config';
import { useDataStore } from '@/lib/data/store';
import {
  getAthleteById,
  getAthleteSessionLogs,
  getMealPlan,
  getMembership,
  getMyRoutine,
  getMyTrainer,
  getRoutineById,
  getSessionLogsForWeek,
  getWeeklyPlan,
} from '@/lib/data/client';
import { resolveAthleteId } from '@/lib/nutrition/resolve-athlete-id';
import { getMondayOfWeek } from '@/lib/workout/session-utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AssignedNutritionPlan } from '@/lib/nutrition/types';
import type {
  Athlete,
  Routine,
  RoutineAssignment,
  SessionLog,
  Trainer,
  WeeklyPlan,
  WeeklyPlanDay,
} from '@/lib/data/types';

async function fetchPlanRoutinesMap(
  weekPlanData: WeeklyPlan | null,
  activeRoutine: Routine | null,
): Promise<Record<string, Routine>> {
  const ids = new Set<string>();
  if (weekPlanData) {
    for (const day of weekPlanData.days) {
      if (day.routineId) ids.add(day.routineId);
    }
  }
  if (activeRoutine?.id) ids.add(activeRoutine.id);

  const map: Record<string, Routine> = {};
  await Promise.all(
    [...ids].map(async (id) => {
      const routine = await getRoutineById(id);
      if (routine) map[id] = routine;
    }),
  );
  return map;
}

export function useAthleteData() {
  const { user } = useAuth();
  const { state, isHydrated } = useDataStore();
  const athleteId = useMemo(() => resolveAthleteId(user), [user]);
  const apiRoutinesMode = isApiRoutinesSource();
  const apiUsersMode = isApiUsersSource();

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<RoutineAssignment | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [planRoutines, setPlanRoutines] = useState<Record<string, Routine>>({});
  const [weekSessionLogs, setWeekSessionLogs] = useState<SessionLog[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [mealPlan, setMealPlan] = useState<AssignedNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStartDate = useMemo(() => getMondayOfWeek(), []);

  const storeAthlete = useMemo(
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
      const [routineResult, logs, assignedTrainer, plan, weekPlanData, weekLogs, loadedAthlete] =
        await Promise.all([
          getMyRoutine(athleteId),
          getAthleteSessionLogs(athleteId),
          getMyTrainer(athleteId),
          getMealPlan(athleteId),
          getWeeklyPlan(athleteId),
          getSessionLogsForWeek(athleteId, weekStartDate),
          apiUsersMode ? getAthleteById(athleteId) : Promise.resolve(null),
        ]);
      if (apiUsersMode) {
        setAthlete(loadedAthlete);
      }
      const routine = routineResult?.routine ?? null;
      setActiveAssignment(routineResult?.assignment ?? null);
      setActiveRoutine(routine);
      setSessionLogs(logs);
      setTrainer(assignedTrainer);
      setMealPlan(plan);
      setWeeklyPlan(weekPlanData);
      setWeekSessionLogs(weekLogs);

      if (apiRoutinesMode) {
        const routinesMap = await fetchPlanRoutinesMap(weekPlanData, routine);
        setPlanRoutines(routinesMap);
      } else {
        setPlanRoutines({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del atleta');
    } finally {
      setIsLoading(false);
    }
  }, [athleteId, weekStartDate, apiRoutinesMode, apiUsersMode]);

  const resolvedAthlete = apiUsersMode ? athlete : storeAthlete;

  useEffect(() => {
    if (!isHydrated) return;
    void refresh();
  }, [
    isHydrated,
    refresh,
    state.assignments,
    state.routines,
    state.sessionLogs,
    state.weeklyPlans,
  ]);

  const getRoutineForDay = useCallback(
    (day: WeeklyPlanDay | undefined): Routine | null => {
      if (!day?.routineId) return null;
      if (apiRoutinesMode) {
        return planRoutines[day.routineId] ?? null;
      }
      return state.routines.find((r) => r.id === day.routineId) ?? null;
    },
    [apiRoutinesMode, planRoutines, state.routines],
  );

  const routineNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    if (apiRoutinesMode) {
      for (const [id, routine] of Object.entries(planRoutines)) {
        map[id] = routine.name;
      }
      if (activeRoutine) {
        map[activeRoutine.id] = activeRoutine.name;
      }
    } else {
      for (const r of state.routines) {
        map[r.id] = r.name;
      }
    }
    return map;
  }, [apiRoutinesMode, planRoutines, activeRoutine, state.routines]);

  const completedSessionsCount = sessionLogs.filter(
    (s) => s.sessionOutcome === 'completed' || s.completed,
  ).length;
  const weekCompletedCount = weekSessionLogs.filter(
    (s) => s.sessionOutcome === 'completed' || s.completed,
  ).length;
  const latestSession = sessionLogs[0] ?? null;

  return {
    athleteId,
    athlete: resolvedAthlete,
    user,
    activeAssignment,
    activeRoutine,
    weeklyPlan,
    planRoutines,
    getRoutineForDay,
    routineNamesById,
    weekSessionLogs,
    weekStartDate,
    weekCompletedCount,
    sessionLogs,
    latestSession,
    trainer,
    mealPlan,
    completedSessionsCount,
    isLoading: !isHydrated || isLoading,
    isHydrated,
    error,
    refresh,
    getMembership: () => (athleteId ? getMembership(athleteId) : Promise.resolve(null)),
  };
}
