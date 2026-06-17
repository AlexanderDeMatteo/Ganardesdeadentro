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

export default function TrainerV2AthleteNutritionPageClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const athleteId = typeof params.athleteId === 'string' ? params.athleteId : '';
  const { athlete, isLoading } = useAthleteForCoach(athleteId);

  useEffect(() => {
    if (isLoading || !athleteId) return;

    if (!athlete) {
      toast.error('Atleta no encontrado.');
      router.replace('/trainer-v2/athletes');
      return;
    }

    if (!canCoachEditAthlete(user?.role, resolveTrainerId(user), athlete.trainerId)) {
      toast.error('No tienes acceso a la nutrición de este atleta.');
      router.replace('/trainer-v2/athletes');
    }
  }, [athlete, athleteId, isLoading, user, router]);

  if (isLoading) {
    return <LoadingState label="Cargando atleta…" />;
  }

  if (!athlete) {
    return null;
  }

  return (
    <NutritionCoachEditor athlete={athlete} backHref="/trainer-v2/athletes" />
  );
}
