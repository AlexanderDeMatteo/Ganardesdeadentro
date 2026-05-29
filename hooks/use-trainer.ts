'use client';

import { useAuth } from '@/app/context/auth-context';
import {
  assignRoutine as clientAssignRoutine,
  createRoutine as clientCreateRoutine,
  deleteRoutine as clientDeleteRoutine,
  unassignRoutine as clientUnassignRoutine,
  updateTrainerProfile as clientUpdateTrainerProfile,
} from '@/lib/data/client';
import { useTrainerData } from '@/hooks/use-trainer-data';
import type { Routine, RoutineAssignment } from '@/lib/data/types';
import { useCallback } from 'react';

export type { RoutineAssignment };

export interface TrainerProfileData {
  specialization: string;
  bio: string;
}

export type { AthleteProfile, Exercise, Routine, Trainer } from '@/lib/data/types';
export { MOCK_ATHLETES, MOCK_EXERCISES, MOCK_TRAINERS } from '@/lib/data/seeds';

export function useTrainer() {
  const { user } = useAuth();
  const trainerId = user?.trainer_id ?? '';

  const {
    trainerInfo,
    myAthletes,
    allAthletes,
    routines,
    assignments,
    exercises,
    profile,
    stats,
    isHydrated,
    isLoading,
    getActiveAssignmentForAthlete,
    getRoutineName,
    setState,
  } = useTrainerData();

  const createRoutine = useCallback(
    async (routine: Omit<Routine, 'id' | 'createdDate'>) => {
      return clientCreateRoutine(routine, trainerId);
    },
    [trainerId],
  );

  const deleteRoutine = useCallback(
    async (id: string) => {
      await clientDeleteRoutine(id);
    },
    [],
  );

  const assignRoutineToAthlete = useCallback(
    async (athleteId: string, routineId: string) => {
      if (!trainerId) return;
      await clientAssignRoutine(athleteId, routineId, trainerId);
    },
    [trainerId],
  );

  const unassignRoutine = useCallback(async (assignmentId: string) => {
    await clientUnassignRoutine(assignmentId);
  }, []);

  const toggleAssignmentCompleted = useCallback(
    (assignmentId: string) => {
      setState((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.id === assignmentId ? { ...a, isActive: !a.isActive } : a,
        ),
      }));
    },
    [setState],
  );

  const updateProfile = useCallback(
    async (data: Partial<TrainerProfileData>) => {
      if (!trainerId) return;
      await clientUpdateTrainerProfile(trainerId, data);
    },
    [trainerId],
  );

  const refreshAthletes = useCallback(() => {
    /* reactive via store */
  }, []);

  return {
    trainerId,
    trainerInfo,
    myAthletes,
    allAthletes,
    routines,
    assignments,
    exercises,
    profile,
    stats,
    isHydrated,
    isLoading,
    getActiveAssignmentForAthlete,
    getRoutineName,
    createRoutine,
    deleteRoutine,
    assignRoutineToAthlete,
    unassignRoutine,
    toggleAssignmentCompleted,
    updateProfile,
    refreshAthletes,
  };
}
