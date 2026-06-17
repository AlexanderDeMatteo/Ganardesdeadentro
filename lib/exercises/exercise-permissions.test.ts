import { describe, expect, it } from 'vitest';
import type { Exercise } from '@/lib/data/types';
import { canManageExercise } from '@/lib/exercises/exercise-permissions';

const customExercise: Exercise = {
  id: 'custom-1',
  name: 'Sentadilla custom',
  targetMuscle: 'quads',
  difficulty: 'beginner',
  equipment: 'barbell',
  isCustom: true,
  createdById: 42,
};

describe('canManageExercise', () => {
  it('denies catalog exercises', () => {
    const catalog = { ...customExercise, isCustom: false };
    expect(canManageExercise(catalog, 'admin')).toBe(false);
  });

  it('allows admin on any custom exercise', () => {
    expect(canManageExercise(customExercise, 'admin')).toBe(true);
  });

  it('allows trainer only on own custom exercises', () => {
    expect(canManageExercise(customExercise, 'trainer', 42)).toBe(true);
    expect(canManageExercise(customExercise, 'trainer', 99)).toBe(false);
  });

  it('denies trainer when userId is missing', () => {
    expect(canManageExercise(customExercise, 'trainer')).toBe(false);
  });
});
