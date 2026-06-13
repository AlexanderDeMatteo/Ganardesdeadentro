'use client';

import { isApiRoutinesSource, isApiUsersSource } from '@/lib/api/config';
import {
  getAdminOverview,
  listAdminAthletes,
  listAdminTrainers,
  listAssignments,
  listExercises,
  listRoutines,
} from '@/lib/data/client';
import { SEED_EXERCISES } from '@/lib/data/seeds';
import type { Athlete, Exercise, Routine, RoutineAssignment, Trainer } from '@/lib/data/types';
import { useDataStore } from '@/lib/data/store';
import { useCallback, useEffect, useState } from 'react';

export function useAdminData() {
  const { state, isHydrated, setState } = useDataStore();
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getAdminOverview>> | null>(null);
  const [apiAthletes, setApiAthletes] = useState<Athlete[] | null>(null);
  const [apiTrainers, setApiTrainers] = useState<Trainer[] | null>(null);
  const [apiExercises, setApiExercises] = useState<Exercise[] | null>(null);
  const [apiRoutines, setApiRoutines] = useState<Routine[] | null>(null);
  const [apiAssignments, setApiAssignments] = useState<RoutineAssignment[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const useApiUsers = isApiUsersSource();
  const useApiRoutines = isApiRoutinesSource();

  const refreshOverview = useCallback(async () => {
    const data = await getAdminOverview();
    setOverview(data);
    setIsLoading(false);
  }, []);

  const refreshUserLists = useCallback(async () => {
    if (!useApiUsers) return;
    const [athletes, trainers] = await Promise.all([
      listAdminAthletes(),
      listAdminTrainers(),
    ]);
    setApiAthletes(athletes);
    setApiTrainers(trainers);
    return trainers;
  }, [useApiUsers]);

  const refreshExercises = useCallback(async () => {
    if (!useApiRoutines) return;
    try {
      const remote = await listExercises({ perPage: 100 });
      setApiExercises(remote.length > 0 ? remote : SEED_EXERCISES);
    } catch {
      setApiExercises(SEED_EXERCISES);
    }
  }, [useApiRoutines]);

  const refreshRoutines = useCallback(async () => {
    if (!useApiRoutines) return;
    const [routines, assignments] = await Promise.all([
      listRoutines(),
      listAssignments(undefined, { activeOnly: false }),
    ]);
    setApiRoutines(routines);
    setApiAssignments(assignments);
  }, [useApiRoutines]);

  useEffect(() => {
    if (!isHydrated) return;
    void refreshOverview();
    if (useApiUsers) {
      void refreshUserLists();
    }
    if (useApiRoutines) {
      void refreshRoutines();
    }
    if (useApiRoutines) {
      void refreshExercises();
    }
  }, [isHydrated, refreshOverview, refreshUserLists, refreshExercises, refreshRoutines, useApiUsers, useApiRoutines, state]);

  const athletes = useApiUsers && apiAthletes !== null ? apiAthletes : state.athletes;
  const trainers = useApiUsers && apiTrainers !== null ? apiTrainers : state.trainers;
  const exercises =
    useApiRoutines && apiExercises !== null ? apiExercises : state.exercises;
  const routines =
    useApiRoutines && apiRoutines !== null ? apiRoutines : state.routines;
  const assignments =
    useApiRoutines && apiAssignments !== null ? apiAssignments : state.assignments;
  const listsLoading =
    (useApiUsers && (apiAthletes === null || apiTrainers === null)) ||
    (useApiRoutines && (apiExercises === null || apiRoutines === null || apiAssignments === null));

  return {
    athletes,
    trainers,
    exercises,
    routines,
    assignments,
    metrics: state.metrics,
    sessionLogs: state.sessionLogs,
    overview,
    isHydrated,
    isLoading: !isHydrated || isLoading || listsLoading,
    setState,
    refreshOverview,
    refreshUserLists,
    refreshExercises,
    refreshRoutines,
  };
}
