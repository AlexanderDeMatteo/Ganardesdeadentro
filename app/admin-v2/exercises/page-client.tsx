'use client';

import { ExerciseLibraryView } from '@/components/exercises/exercise-library-view';
import { useAdmin } from '@/hooks/use-admin';

export default function AdminV2ExercisesPage() {
  const { exercisesError, refreshExercises } = useAdmin();

  return (
    <ExerciseLibraryView
      mode="admin"
      exercisesError={exercisesError}
      onRefreshLegacy={() => refreshExercises()}
    />
  );
}
