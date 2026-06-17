'use client';

import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { NutritionPageContent } from '@/components/nutrition/nutrition-page-content';

export default function NutritionPageClient() {
  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Nutrición"
        subtitle="Tu plan nutricional asignado por tu entrenador y registro diario de comidas e hidratación."
      />
      <NutritionPageContent />
    </div>
  );
}
