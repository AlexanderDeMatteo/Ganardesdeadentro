'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { NutritionPageContent } from '@/components/nutrition/nutrition-page-content';

function NutritionContent() {
  return (
    <>
      <Navbar />
      <main className="brand-shell min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-3">
            <p className="brand-kicker">Fuel your gains</p>
            <h1 className="brand-title text-5xl font-black">Nutrición</h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              Tu plan nutricional asignado por tu entrenador y registro diario de comidas e hidratación.
            </p>
          </div>
          <NutritionPageContent />
        </div>
      </main>
    </>
  );
}

export default function NutritionPageClient() {
  return (
    <ProtectedRoute>
      <NutritionContent />
    </ProtectedRoute>
  );
}
