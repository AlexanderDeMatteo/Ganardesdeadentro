'use client';

import {
  assignTrainerToAthlete as clientAssignTrainer,
  createRoutine as clientCreateRoutine,
  deleteRoutine as clientDeleteRoutine,
  updateRoutine as clientUpdateRoutine,
} from '@/lib/data/client';
import { useAdminData } from '@/hooks/use-admin-data';
import { useCallback } from 'react';

export type {
  Athlete,
  AthleteProfile,
  Exercise,
  Routine,
  Trainer,
} from '@/lib/data/types';

export {
  MOCK_ATHLETES,
  MOCK_EXERCISES,
  MOCK_ROUTINES,
  MOCK_TRAINERS,
} from '@/lib/data/seeds';

export function useAdmin() {
  const {
    athletes,
    trainers,
    exercises,
    routines,
    isHydrated,
    isLoading,
    setState,
  } = useAdminData();

  const getAthleteById = useCallback(
    (id: string) => athletes.find((a) => a.id === id),
    [athletes],
  );

  const getTrainerById = useCallback(
    (id: string) => trainers.find((t) => t.id === id),
    [trainers],
  );

  const assignTrainerToAthlete = useCallback(
    async (athleteId: string, trainerId: string) => {
      await clientAssignTrainer(athleteId, trainerId);
    },
    [],
  );

  const createRoutine = useCallback(
    async (routine: Parameters<typeof clientCreateRoutine>[0]) => {
      return clientCreateRoutine(routine);
    },
    [],
  );

  const updateRoutine = useCallback(
    async (id: string, routine: Parameters<typeof clientUpdateRoutine>[1]) => {
      await clientUpdateRoutine(id, routine);
    },
    [],
  );

  const deleteRoutine = useCallback(async (id: string) => {
    await clientDeleteRoutine(id);
  }, []);

  const saveData = useCallback(
    (data: { athletes?: typeof athletes; routines?: typeof routines }) => {
      setState((prev) => ({
        ...prev,
        athletes: data.athletes ?? prev.athletes,
        routines: data.routines ?? prev.routines,
      }));
    },
    [setState],
  );

  return {
    athletes,
    trainers,
    exercises,
    routines,
    isLoading: isLoading || !isHydrated,
    getAthleteById,
    getTrainerById,
    assignTrainerToAthlete,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    saveData,
  };
}
