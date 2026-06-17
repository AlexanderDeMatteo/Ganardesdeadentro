import type { Exercise } from '@/lib/data/types';

export function canManageExercise(
  exercise: Exercise,
  mode: 'admin' | 'trainer',
  userId?: string | number | null,
): boolean {
  if (!exercise.isCustom) return false;
  if (mode === 'admin') return true;
  if (userId == null || exercise.createdById == null) return false;
  return String(exercise.createdById) === String(userId);
}
