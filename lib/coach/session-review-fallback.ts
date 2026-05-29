import { formatSessionReviewForDisplay } from '@/lib/coach/session-review-format';
import { mergeSessionReview } from '@/lib/coach/session-review-merge';
import { deriveCoachMoodFromExercises } from '@/lib/coach/session-review-sections';
import type { CoachMood, SessionReviewRequest } from '@/lib/coach/types';

export function titanMoodToCoachMood(tono: 'celebrating' | 'speaking' | 'warning'): CoachMood {
  return tono;
}

export function pickSessionReviewFallback(payload: SessionReviewRequest): {
  frase: string;
  mood: CoachMood;
} {
  const review = mergeSessionReview(
    payload.userName,
    {
      routineName: payload.routineName,
      completedSets: payload.completedSets,
      failedSets: payload.failedSets,
      totalPlannedSets: payload.totalPlannedSets,
      qualityTone: payload.qualityTone,
      sessionOutcome: payload.sessionOutcome,
      maxFailedInOneExercise: payload.maxFailedInOneExercise,
      exercises: payload.exercises,
    },
    null,
  );
  const frase = formatSessionReviewForDisplay(review);
  const mood = deriveCoachMoodFromExercises(
    payload.exercises,
    payload.qualityTone,
    payload.sessionOutcome,
  );
  return { frase, mood };
}
