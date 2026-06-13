import type { User } from '@/app/context/auth-context';
import { getDataState } from '@/lib/data/store';
import type { Athlete, Trainer } from '@/lib/data/types';

export interface GuardUser {
  id: string;
  email?: string;
  role: User['role'];
  trainer_id?: string;
}

/** Trainer scope id: API login exposes user.id, not trainer_id on the user row. */
export function resolveTrainerId(user: GuardUser | null | undefined): string {
  if (!user) return '';
  if (user.role === 'trainer') return user.trainer_id ?? user.id;
  return user.trainer_id ?? '';
}

/**
 * UX guard: admin can access any trainer in the platform.
 */
export function canAdminAccessTrainer(
  user: GuardUser | null | undefined,
  _trainerId: string,
): boolean {
  return user?.role === 'admin';
}

/**
 * Generalized from canCoachEditAthlete — coach/admin nutrition & athlete detail access.
 */
export function canCoachEditAthlete(
  userRole: string | undefined,
  userTrainerId: string | undefined,
  athleteTrainerId: string | undefined,
): boolean {
  if (userRole === 'admin') return true;
  if (userRole === 'trainer' && userTrainerId && athleteTrainerId === userTrainerId) return true;
  return false;
}

export function findAthleteInStore(athleteId: string): Athlete | null {
  return getDataState().athletes.find((a) => a.id === athleteId) ?? null;
}

export function findTrainerInStore(trainerId: string): Trainer | null {
  return getDataState().trainers.find((t) => t.id === trainerId) ?? null;
}
