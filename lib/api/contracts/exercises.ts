import type { Difficulty, ExerciseAnimationSource, ExerciseAnimationType } from '@/lib/data/types';

export type CreateExercisePayload = {
  name: string;
  targetMuscle: string;
  equipment?: string;
  difficulty?: Difficulty;
  description?: string;
};

export type UpdateExercisePayload = Partial<CreateExercisePayload>;

export type ApiExerciseResponse = {
  id?: number | string;
  exercise_db_id?: string;
  name: string;
  target_muscle?: string;
  target?: string;
  equipment?: string;
  difficulty?: string | null;
  description?: string | null;
  gif_url?: string | null;
  animation_url?: string | null;
  animation_type?: ExerciseAnimationType | null;
  animation_source?: ExerciseAnimationSource | null;
  is_custom?: boolean;
  is_active?: boolean;
  created_by_id?: number | null;
};
