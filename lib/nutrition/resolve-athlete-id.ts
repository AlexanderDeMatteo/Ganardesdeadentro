import type { User } from '@/app/context/auth-context';
import {
  isApiAuthSource,
  isApiMetricsSource,
  isApiNutritionSource,
  isApiRoutinesSource,
  isApiUsersSource,
} from '@/lib/api/config';
import { getDataState } from '@/lib/data/store';
import { SEED_ATHLETES } from '@/lib/data/seeds';
import type { Athlete } from '@/lib/data/types';

/** Explicit demo mapping when auth email differs from athlete mock email (solo modo local) */
const EMAIL_TO_ATHLETE_ID: Record<string, string> = {
  'test@example.com': '1',
  'pro@example.com': '1',
  'basic@example.com': '5',
};

function isApiAthleteLookupMode(): boolean {
  return isApiAuthSource() || isApiUsersSource() || isApiNutritionSource();
}

function loadAthletesFromStore(): Athlete[] {
  if (typeof window === 'undefined') {
    return isApiAthleteLookupMode() ? [] : SEED_ATHLETES;
  }
  try {
    const athletes = getDataState().athletes;
    if (athletes.length > 0) return athletes;
  } catch {
    /* fall through */
  }
  return isApiAthleteLookupMode() ? [] : SEED_ATHLETES;
}

export function resolveAthleteId(user: User | null): string | null {
  if (!user) return null;
  if (user.role !== 'user') return null;

  if (
    isApiAuthSource() ||
    isApiMetricsSource() ||
    isApiNutritionSource() ||
    isApiRoutinesSource()
  ) {
    return user.id;
  }

  const mapped = EMAIL_TO_ATHLETE_ID[user.email.toLowerCase()];
  if (mapped) return mapped;

  const athletes = loadAthletesFromStore();
  const byEmail = athletes.find((a) => a.email.toLowerCase() === user.email.toLowerCase());
  if (byEmail) return byEmail.id;

  const byUserId = athletes.find((a) => a.userId === user.id);
  if (byUserId) return byUserId.id;

  const byId = athletes.find((a) => a.id === user.id);
  if (byId) return byId.id;

  return user.id;
}

export function findAthleteById(athleteId: string): Athlete | null {
  if (isApiAthleteLookupMode()) {
    return null;
  }
  const athletes = loadAthletesFromStore();
  const match = athletes.find((a) => a.id === athleteId);
  if (match) return match;
  return SEED_ATHLETES.find((a) => a.id === athleteId) ?? null;
}
