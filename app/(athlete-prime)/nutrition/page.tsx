import type { Metadata } from 'next';
import NutritionPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Nutrición | Be a Gainer',
  description:
    'Calcula tu tasa metabólica basal, distribuye macros y organiza tu plan de alimentación semanal en Be a Gainer.',
};

export default function NutritionPage() {
  return <NutritionPageClient />;
}
