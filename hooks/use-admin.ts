'use client';

import {
  assignTrainerToAthlete as clientAssignTrainer,
  assignUserMembership as clientAssignUserMembership,
  createAdminTrainer as clientCreateTrainer,
  createRoutine as clientCreateRoutine,
  deactivateAdminTrainer as clientDeactivateTrainer,
  deleteRoutine as clientDeleteRoutine,
  reactivateAdminTrainer as clientReactivateTrainer,
  resendTrainerInvite as clientResendTrainerInvite,
  updateAdminTrainer as clientUpdateAdminTrainer,
  unassignTrainerFromAthlete as clientUnassignTrainer,
  updateAthlete as clientUpdateAthlete,
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

export function useAdmin() {
  const {
    athletes,
    trainers,
    exercises,
    routines,
    overview,
    isHydrated,
    isLoading,
    refreshOverview,
    refreshUserLists,
    refreshRoutines,
    refreshExercises,
    exercisesError,
  } = useAdminData();

  const getAthleteById = useCallback(
    (id: string) => athletes.find((a) => a.id === id),
    [athletes],
  );

  const getTrainerById = useCallback(
    (id: string) => trainers.find((t) => t.id === id),
    [trainers],
  );

  const assignableTrainers = trainers.filter(
    (t) => t.isActive !== false && !t.invitePending,
  );

  const assignTrainerToAthlete = useCallback(
    async (athleteId: string, trainerId: string) => {
      await clientAssignTrainer(athleteId, trainerId);
      await Promise.all([refreshOverview(), refreshUserLists()]);
    },
    [refreshOverview, refreshUserLists],
  );

  const unassignTrainerFromAthlete = useCallback(
    async (athleteId: string) => {
      await clientUnassignTrainer(athleteId);
      await Promise.all([refreshOverview(), refreshUserLists()]);
    },
    [refreshOverview, refreshUserLists],
  );

  const createTrainer = useCallback(
    async (payload: {
      email: string;
      firstName: string;
      lastName: string;
      specialization?: string;
    }) => {
      const created = await clientCreateTrainer(payload);
      await Promise.all([refreshOverview(), refreshUserLists()]);
      return created;
    },
    [refreshOverview, refreshUserLists],
  );

  const deactivateTrainer = useCallback(
    async (
      trainerId: string,
      athleteActions: Array<{
        athleteId: string;
        action: 'reassign' | 'unassign';
        newTrainerId?: string;
      }>,
    ) => {
      await clientDeactivateTrainer(trainerId, athleteActions);
      await Promise.all([refreshOverview(), refreshUserLists()]);
    },
    [refreshOverview, refreshUserLists],
  );

  const resendTrainerInvite = useCallback(
    async (trainerId: string) => {
      await clientResendTrainerInvite(trainerId);
    },
    [],
  );

  const reactivateTrainer = useCallback(
    async (trainerId: string) => {
      await clientReactivateTrainer(trainerId);
      await Promise.all([refreshOverview(), refreshUserLists()]);
    },
    [refreshOverview, refreshUserLists],
  );

  const updateTrainerCapacity = useCallback(
    async (trainerId: string, maxAthletes: number) => {
      await clientUpdateAdminTrainer(trainerId, { maxAthletes });
      await refreshUserLists();
    },
    [refreshUserLists],
  );

  const updateAthlete = useCallback(
    async (athleteId: string, patch: Parameters<typeof clientUpdateAthlete>[1]) => {
      const updated = await clientUpdateAthlete(athleteId, patch);
      await refreshUserLists();
      return updated;
    },
    [refreshUserLists],
  );

  const assignMembershipToAthlete = useCallback(
    async (athleteId: string, planId: string) => {
      await clientAssignUserMembership(athleteId, planId);
      await refreshUserLists();
    },
    [refreshUserLists],
  );

  const createRoutine = useCallback(
    async (routine: Parameters<typeof clientCreateRoutine>[0]) => {
      const created = await clientCreateRoutine(routine);
      await Promise.all([refreshRoutines(), refreshExercises()]);
      return created;
    },
    [refreshRoutines, refreshExercises],
  );

  const updateRoutine = useCallback(
    async (id: string, routine: Parameters<typeof clientUpdateRoutine>[1]) => {
      await clientUpdateRoutine(id, routine);
      await refreshRoutines();
    },
    [refreshRoutines],
  );

  const deleteRoutine = useCallback(
    async (id: string) => {
      await clientDeleteRoutine(id);
      await refreshRoutines();
    },
    [refreshRoutines],
  );

  return {
    athletes,
    trainers,
    assignableTrainers,
    exercises,
    routines,
    overview,
    isLoading: isLoading || !isHydrated,
    getAthleteById,
    getTrainerById,
    assignTrainerToAthlete,
    unassignTrainerFromAthlete,
    createTrainer,
    deactivateTrainer,
    reactivateTrainer,
    updateTrainerCapacity,
    resendTrainerInvite,
    updateAthlete,
    assignMembershipToAthlete,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    refreshOverview,
    refreshUserLists,
    refreshExercises,
    exercisesError,
  };
}
