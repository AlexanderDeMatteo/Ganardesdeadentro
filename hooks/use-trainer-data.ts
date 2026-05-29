'use client';

import { useAuth } from '@/app/context/auth-context';
import { useDataStore } from '@/lib/data/store';
import { getTrainerAthletes } from '@/lib/data/client';
import type { Athlete, Routine, RoutineAssignment } from '@/lib/data/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useTrainerData() {
  const { user } = useAuth();
  const { state, isHydrated, setState } = useDataStore();
  const trainerId = user?.trainer_id ?? '';

  const [myAthletes, setMyAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated || !trainerId) {
      setIsLoading(false);
      return;
    }
    void getTrainerAthletes(trainerId).then((athletes) => {
      setMyAthletes(athletes);
      setIsLoading(false);
    });
  }, [isHydrated, trainerId, state.athletes]);

  const routines = useMemo(
    () => state.routines.filter((r) => !r.trainerId || r.trainerId === trainerId),
    [state.routines, trainerId],
  );

  const assignments = useMemo(
    () => state.assignments.filter((a) => a.trainerId === trainerId),
    [state.assignments, trainerId],
  );

  const trainerInfo = useMemo(
    () => state.trainers.find((t) => t.id === trainerId),
    [state.trainers, trainerId],
  );

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
    (routineId: string) => state.routines.find((r) => r.id === routineId)?.name ?? '—',
    [state.routines],
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
      setState((prev) => ({
        ...prev,
        assignments: [
          ...prev.assignments.filter((a) => a.trainerId !== trainerId),
          ...next,
        ],
      }));
    },
    [setState, trainerId],
  );

  const persistRoutines = useCallback(
    (next: Routine[]) => {
      setState((prev) => ({
        ...prev,
        routines: [
          ...prev.routines.filter((r) => r.trainerId && r.trainerId !== trainerId),
          ...next,
        ],
      }));
    },
    [setState, trainerId],
  );

  return {
    trainerId,
    trainerInfo,
    myAthletes,
    allAthletes: state.athletes,
    routines,
    assignments,
    exercises: state.exercises,
    profile,
    stats,
    isHydrated,
    isLoading: !isHydrated || isLoading,
    getActiveAssignmentForAthlete,
    getRoutineName,
    persistAssignments,
    persistRoutines,
    setState,
  };
}

export type { RoutineAssignment };
