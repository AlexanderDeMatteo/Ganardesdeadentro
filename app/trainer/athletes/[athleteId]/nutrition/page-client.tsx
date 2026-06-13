'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NutritionCoachEditor } from '@/components/nutrition/nutrition-coach-editor';
import { useAuth } from '@/app/context/auth-context';
import { canCoachEditAthlete } from '@/hooks/use-coach-nutrition';
import { useAthleteForCoach } from '@/hooks/use-athlete-for-coach';
import { resolveTrainerId } from '@/lib/auth/guards';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';

export default function TrainerAthleteNutritionPageClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const athleteId = typeof params.athleteId === 'string' ? params.athleteId : '';
  const { athlete, isLoading } = useAthleteForCoach(athleteId);

  useEffect(() => {
    if (isLoading || !athleteId) return;

    if (!athlete) {
      toast.error('Atleta no encontrado.');
      router.replace('/trainer/athletes');
      return;
    }

    if (!canCoachEditAthlete(user?.role, resolveTrainerId(user), athlete.trainerId)) {
      toast.error('No tienes acceso a la nutrición de este atleta.');
      router.replace('/trainer/athletes');
    }
  }, [athlete, athleteId, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="px-8 py-12">
        <LoadingState label="Cargando atleta…" />
      </div>
    );
  }

  if (!athlete) {
    return null;
  }

  return (
    <div className="px-8 py-12">
      <NutritionCoachEditor athlete={athlete} backHref="/trainer/athletes" />
    </div>
  );
}
