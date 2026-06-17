'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NutritionCoachEditor } from '@/components/nutrition/nutrition-coach-editor';
import { useAthleteForCoach } from '@/hooks/use-athlete-for-coach';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';

export default function AdminV2AthleteNutritionPageClient() {
  const params = useParams();
  const router = useRouter();
  const athleteId = typeof params.athleteId === 'string' ? params.athleteId : '';
  const { athlete, isLoading } = useAthleteForCoach(athleteId);

  useEffect(() => {
    if (isLoading || !athleteId) return;
    if (!athlete) {
      toast.error('Atleta no encontrado.');
      router.replace('/admin-v2/athletes');
    }
  }, [athlete, athleteId, isLoading, router]);

  if (isLoading) {
    return (
      <div className="py-6">
        <LoadingState label="Cargando atleta…" />
      </div>
    );
  }

  if (!athlete) {
    return null;
  }

  return (
    <div className="py-2">
      <NutritionCoachEditor athlete={athlete} backHref="/admin-v2/athletes" />
    </div>
  );
}
