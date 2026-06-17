'use client';

import { useAuth } from '@/app/context/auth-context';
import { ExerciseLibraryView } from '@/components/exercises/exercise-library-view';
import { useTrainer } from '@/hooks/use-trainer';
import { resolveTrainerId } from '@/lib/auth/guards';

export default function TrainerV2ExercisesPageClient() {
  const { user } = useAuth();
  const trainerId = resolveTrainerId(user);
  const { exercisesError, refreshAthletes } = useTrainer();

  return (
    <ExerciseLibraryView
      mode="trainer"
      userId={trainerId}
      exercisesError={exercisesError}
      onRefreshLegacy={() => refreshAthletes()}
    />
  );
}
