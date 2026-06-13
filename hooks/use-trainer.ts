'use client';

import { useAuth } from '@/app/context/auth-context';
import { isApiRoutinesSource } from '@/lib/api/config';
import {
  assignRoutine as clientAssignRoutine,
  createRoutine as clientCreateRoutine,
  deleteRoutine as clientDeleteRoutine,
  unassignRoutine as clientUnassignRoutine,
  updateRoutine as clientUpdateRoutine,
  updateTrainerProfile as clientUpdateTrainerProfile,
} from '@/lib/data/client';
import { useTrainerData } from '@/hooks/use-trainer-data';
import { resolveTrainerId } from '@/lib/auth/guards';
import type { Routine, RoutineAssignment } from '@/lib/data/types';
import { useCallback } from 'react';
import { toast } from 'sonner';

export type { RoutineAssignment };

export interface TrainerProfileData {
  specialization: string;
  bio: string;
}

export type { AthleteProfile, Exercise, Routine, Trainer } from '@/lib/data/types';

export function useTrainer() {
  const { user } = useAuth();
  const trainerId = resolveTrainerId(user);

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
    refresh,
  } = useTrainerData();

  const createRoutine = useCallback(
    async (routine: Omit<Routine, 'id' | 'createdDate'>) => {
      try {
        const created = await clientCreateRoutine(routine, trainerId);
        await refresh();
        return created;
      } catch {
        toast.error('No se pudo crear la rutina');
        throw new Error('createRoutine failed');
      }
    },
    [trainerId, refresh],
  );

  const deleteRoutine = useCallback(
    async (id: string) => {
      try {
        await clientDeleteRoutine(id);
        await refresh();
      } catch {
        toast.error('No se pudo eliminar la rutina');
        throw new Error('deleteRoutine failed');
      }
    },
    [refresh],
  );

  const updateRoutine = useCallback(
    async (id: string, routine: Parameters<typeof clientUpdateRoutine>[1]) => {
      try {
        await clientUpdateRoutine(id, routine);
        await refresh();
      } catch {
        toast.error('No se pudo actualizar la rutina');
        throw new Error('updateRoutine failed');
      }
    },
    [refresh],
  );

  const assignRoutineToAthlete = useCallback(
    async (athleteId: string, routineId: string) => {
      if (!trainerId) return;
      await clientAssignRoutine(athleteId, routineId, trainerId);
      await refresh();
    },
    [trainerId, refresh],
  );

  const unassignRoutine = useCallback(
    async (assignmentId: string) => {
      await clientUnassignRoutine(assignmentId);
      await refresh();
    },
    [refresh],
  );

  const toggleAssignmentCompleted = useCallback(
    async (assignmentId: string) => {
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment || !trainerId) return;

      if (isApiRoutinesSource()) {
        try {
          if (assignment.isActive) {
            await clientUnassignRoutine(assignmentId);
          } else {
            await clientAssignRoutine(assignment.athleteId, assignment.routineId, trainerId);
          }
          await refresh();
        } catch {
          toast.error('No se pudo actualizar la asignación');
        }
        return;
      }

      setState((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.id === assignmentId ? { ...a, isActive: !a.isActive } : a,
        ),
      }));
    },
    [assignments, trainerId, refresh, setState],
  );

  const updateProfile = useCallback(
    async (data: Partial<TrainerProfileData>) => {
      if (!trainerId) {
        toast.error('No se pudo identificar al entrenador');
        throw new Error('missing trainerId');
      }
      try {
        await clientUpdateTrainerProfile(trainerId, data);
        await refresh();
        toast.success('Perfil actualizado');
      } catch {
        toast.error('No se pudo guardar el perfil');
        throw new Error('updateProfile failed');
      }
    },
    [trainerId, refresh],
  );

  const refreshAthletes = useCallback(() => {
    void refresh();
  }, [refresh]);

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
    updateRoutine,
    assignRoutineToAthlete,
    unassignRoutine,
    toggleAssignmentCompleted,
    updateProfile,
    refreshAthletes,
  };
}
