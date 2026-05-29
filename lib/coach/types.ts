export type CoachMood = 'idle' | 'speaking' | 'celebrating' | 'warning';

export interface CoachTip {
  eyebrow: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  mood: CoachMood;
}

import type { ExerciseReviewItem } from '@/lib/coach/exercise-review';

export type SessionReviewRequest = {
  userName: string;
  routineName: string;
  completedSets: number;
  failedSets: number;
  totalPlannedSets: number;
  qualityTone: 'success' | 'warning' | 'danger' | 'neutral';
  sessionOutcome: 'completed' | 'abandoned';
  maxFailedInOneExercise: number;
  exercises: ExerciseReviewItem[];
};
