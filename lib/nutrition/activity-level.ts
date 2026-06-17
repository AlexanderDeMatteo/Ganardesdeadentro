import type { ActivityLevel } from './types';

const LEGACY_ACTIVITY_MAP: Record<string, ActivityLevel> = {
  intense: 'active',
  very_intense: 'very_active',
};

const VALID_LEVELS = new Set<ActivityLevel>([
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
]);

export function normalizeActivityLevel(value: unknown, fallback: ActivityLevel = 'moderate'): ActivityLevel {
  if (typeof value !== 'string') return fallback;
  const mapped = LEGACY_ACTIVITY_MAP[value] ?? value;
  if (VALID_LEVELS.has(mapped as ActivityLevel)) {
    return mapped as ActivityLevel;
  }
  return fallback;
}
