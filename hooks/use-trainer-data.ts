'use client';

import { useAuth } from '@/app/context/auth-context';
import { isApiRoutinesSource, isApiUsersSource } from '@/lib/api/config';
import { resolveTrainerId } from '@/lib/auth/guards';
import {
  getTrainerAthletes,
  getTrainerById,
  listAssignments,
  listExercises,
  listRoutines,
} from '@/lib/data/client';
import { SEED_EXERCISES } from '@/lib/data/seeds';
import { useDataStore } from '@/lib/data/store';
import type { Athlete, Exercise, Routine, RoutineAssignment, Trainer } from '@/lib/data/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useTrainerData() {
  const { user } = useAuth();
  const { state, isHydrated, setState } = useDataStore();
  const trainerId = resolveTrainerId(user);
  const apiRoutinesMode = isApiRoutinesSource();
  const apiUsersMode = isApiUsersSource();

  const [myAthletes, setMyAthletes] = useState<Athlete[]>([]);
  const [apiRoutines, setApiRoutines] = useState<Routine[]>([]);
  const [apiAssignments, setApiAssignments] = useState<RoutineAssignment[]>([]);
  const [apiTrainer, setApiTrainer] = useState<Trainer | null>(null);
  const [apiExercises, setApiExercises] = useState<Exercise[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!trainerId) {
      setMyAthletes([]);
      setApiRoutines([]);
      setApiAssignments([]);
      setApiTrainer(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const athletes = await getTrainerAthletes(trainerId);
      setMyAthletes(athletes);
      if (apiUsersMode) {
        const trainer = await getTrainerById(trainerId);
        setApiTrainer(trainer);
      } else {
        setApiTrainer(null);
      }
      if (apiRoutinesMode) {
        const [routines, assignments, remoteExercises] = await Promise.all([
          listRoutines(trainerId),
          listAssignments(trainerId, { activeOnly: false }),
          listExercises({ perPage: 100 }).catch(() => SEED_EXERCISES),
        ]);
        setApiRoutines(routines);
        setApiAssignments(assignments);
        setApiExercises(remoteExercises.length > 0 ? remoteExercises : SEED_EXERCISES);
      } else {
        setApiExercises(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [trainerId, apiRoutinesMode, apiUsersMode]);

  const storeAthletesKey = apiRoutinesMode ? 'api' : state.athletes;

  useEffect(() => {
    if (!isHydrated) return;
    void refresh();
  }, [isHydrated, refresh, storeAthletesKey]);

  const routines = useMemo(() => {
    if (apiRoutinesMode) return apiRoutines;
    return state.routines.filter((r) => !r.trainerId || r.trainerId === trainerId);
  }, [apiRoutinesMode, apiRoutines, state.routines, trainerId]);

  const assignments = useMemo(() => {
    if (apiRoutinesMode) return apiAssignments;
    return state.assignments.filter((a) => a.trainerId === trainerId);
  }, [apiRoutinesMode, apiAssignments, state.assignments, trainerId]);

  const trainerInfo = useMemo(() => {
    if (apiUsersMode) return apiTrainer;
    return state.trainers.find((t) => t.id === trainerId);
  }, [apiUsersMode, apiTrainer, state.trainers, trainerId]);

  const profile = useMemo(
    () => ({
      specialization: trainerInfo?.specialization ?? '',
      bio: trainerInfo?.bio ?? '',
    }),
    [trainerInfo],
  );

  const getActiveAssignmentForAthlete = useCallback(
    (athleteId: string) => assignments.find((a) => a.athleteId === athleteId && a.isActive),
    [assignments],
  );

  const getRoutineName = useCallback(
    (routineId: string) => routines.find((r) => r.id === routineId)?.name ?? '—',
    [routines],
  );

  const stats = useMemo(() => {
    const withRoutine = myAthletes.filter((a) => getActiveAssignmentForAthlete(a.id)).length;
    const activeAssignments = assignments.filter((a) => a.isActive).length;
    const withoutRoutine = myAthletes.length - withRoutine;
    const routineCoverage =
      myAthletes.length > 0 ? Math.round((withRoutine / myAthletes.length) * 100) : 0;

    return {
      athleteCount: myAthletes.length,
      routineCount: routines.length,
      activeAssignments,
      withoutRoutine,
      routineCoverage,
    };
  }, [myAthletes, routines, assignments, getActiveAssignmentForAthlete]);

  const persistAssignments = useCallback(
    (next: RoutineAssignment[]) => {
      if (apiRoutinesMode) return;
      setState((prev) => ({
        ...prev,
        assignments: [
          ...prev.assignments.filter((a) => a.trainerId !== trainerId),
          ...next,
        ],
      }));
    },
    [apiRoutinesMode, setState, trainerId],
  );

  const persistRoutines = useCallback(
    (next: Routine[]) => {
      if (apiRoutinesMode) return;
      setState((prev) => ({
        ...prev,
        routines: [
          ...prev.routines.filter((r) => r.trainerId && r.trainerId !== trainerId),
          ...next,
        ],
      }));
    },
    [apiRoutinesMode, setState, trainerId],
  );

  return {
    trainerId,
    trainerInfo,
    myAthletes,
    allAthletes: apiUsersMode ? myAthletes : state.athletes,
    routines,
    assignments,
    exercises: apiRoutinesMode && apiExercises !== null ? apiExercises : state.exercises,
    profile,
    stats,
    isHydrated,
    isLoading: !isHydrated || isLoading,
    getActiveAssignmentForAthlete,
    getRoutineName,
    persistAssignments,
    persistRoutines,
    refresh,
    setState,
  };
}

export type { RoutineAssignment };
