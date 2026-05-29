import type { User } from '@/app/context/auth-context';
import { getDataState } from '@/lib/data/store';
import type { Athlete, Trainer } from '@/lib/data/types';

export interface GuardUser {
  id: string;
  email?: string;
  role: User['role'];
  trainer_id?: string;
}

/**
 * UX guard: trainer can only access athletes assigned to them.
 * Real authorization must be enforced on the backend.
 */
export function canTrainerAccessAthlete(
  user: GuardUser | null | undefined,
  athleteId: string,
): boolean {
  if (!user || user.role !== 'trainer' || !user.trainer_id) return false;
  const athlete = getDataState().athletes.find((a) => a.id === athleteId);
  return athlete?.trainerId === user.trainer_id;
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
 * UX guard: who can read/write athlete-scoped data.
 */
export function canAccessAthleteData(
  user: GuardUser | null | undefined,
  athleteId: string,
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'user') {
    const athlete = getDataState().athletes.find((a) => a.id === athleteId);
    if (!athlete) return false;
    const email = user.email?.toLowerCase();
    return (
      athlete.userId === user.id ||
      athlete.id === user.id ||
      (email != null && athlete.email.toLowerCase() === email)
    );
  }
  if (user.role === 'trainer') return canTrainerAccessAthlete(user, athleteId);
  return false;
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
