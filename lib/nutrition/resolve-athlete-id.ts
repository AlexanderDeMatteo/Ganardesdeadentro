import type { User } from '@/app/context/auth-context';
import { getDataState } from '@/lib/data/store';
import { SEED_ATHLETES } from '@/lib/data/seeds';
import type { Athlete } from '@/lib/data/types';

/** Explicit demo mapping when auth email differs from athlete mock email */
const EMAIL_TO_ATHLETE_ID: Record<string, string> = {
  'test@example.com': '1',
  'pro@example.com': '1',
  'basic@example.com': '5',
};

function loadAthletesFromStore(): Athlete[] {
  if (typeof window === 'undefined') return SEED_ATHLETES;
  try {
    const athletes = getDataState().athletes;
    if (athletes.length > 0) return athletes;
  } catch {
    /* use seeds */
  }
  return SEED_ATHLETES;
}

export function resolveAthleteId(user: User | null): string | null {
  if (!user) return null;
  if (user.role !== 'user') return null;

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
  const athletes = loadAthletesFromStore();
  return athletes.find((a) => a.id === athleteId) ?? null;
}
