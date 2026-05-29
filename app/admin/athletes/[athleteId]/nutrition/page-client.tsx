'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NutritionCoachEditor } from '@/components/nutrition/nutrition-coach-editor';
import { findAthleteById } from '@/lib/nutrition/resolve-athlete-id';
import { toast } from 'sonner';

export default function AdminAthleteNutritionPageClient() {
  const params = useParams();
  const router = useRouter();
  const athleteId = typeof params.athleteId === 'string' ? params.athleteId : '';
  const athlete = findAthleteById(athleteId);

  useEffect(() => {
    if (!athlete) {
      toast.error('Atleta no encontrado.');
      router.replace('/admin/athletes');
    }
  }, [athlete, router]);

  if (!athlete) {
    return null;
  }

  return (
    <div className="px-8 py-12">
      <NutritionCoachEditor athlete={athlete} backHref="/admin/athletes" />
    </div>
  );
}
