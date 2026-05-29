'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NutritionCoachEditor } from '@/components/nutrition/nutrition-coach-editor';
import { useAuth } from '@/app/context/auth-context';
import { findAthleteById } from '@/lib/nutrition/resolve-athlete-id';
import { canCoachEditAthlete } from '@/hooks/use-coach-nutrition';
import { toast } from 'sonner';

export default function TrainerAthleteNutritionPageClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const athleteId = typeof params.athleteId === 'string' ? params.athleteId : '';
  const athlete = findAthleteById(athleteId);

  useEffect(() => {
    if (!athlete) {
      toast.error('Atleta no encontrado.');
      router.replace('/trainer/athletes');
      return;
    }
    if (
      !canCoachEditAthlete(user?.role, user?.trainer_id, athlete.trainerId)
    ) {
      toast.error('No tienes acceso a la nutrición de este atleta.');
      router.replace('/trainer/athletes');
    }
  }, [athlete, user, router]);

  if (!athlete) {
    return null;
  }

  return (
    <div className="px-8 py-12">
      <NutritionCoachEditor athlete={athlete} backHref="/trainer/athletes" />
    </div>
  );
}
