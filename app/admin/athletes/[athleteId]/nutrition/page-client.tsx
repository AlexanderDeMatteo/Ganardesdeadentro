'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NutritionCoachEditor } from '@/components/nutrition/nutrition-coach-editor';
import { useAthleteForCoach } from '@/hooks/use-athlete-for-coach';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';

export default function AdminAthleteNutritionPageClient() {
  const params = useParams();
  const router = useRouter();
  const athleteId = typeof params.athleteId === 'string' ? params.athleteId : '';
  const { athlete, isLoading } = useAthleteForCoach(athleteId);

  useEffect(() => {
    if (isLoading || !athleteId) return;
    if (!athlete) {
      toast.error('Atleta no encontrado.');
      router.replace('/admin/athletes');
    }
  }, [athlete, athleteId, isLoading, router]);

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
      <NutritionCoachEditor athlete={athlete} backHref="/admin/athletes" />
    </div>
  );
}
