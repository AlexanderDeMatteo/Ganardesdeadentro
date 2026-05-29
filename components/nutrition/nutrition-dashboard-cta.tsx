'use client';

import { useNutrition } from '@/hooks/use-nutrition';
import { Apple } from 'lucide-react';
import Link from 'next/link';

export function NutritionDashboardCta() {
  const { macroTargets, hasAssignedPlan } = useNutrition();
  const targetKcal = macroTargets?.calories;

  return (
    <Link
      href="/nutrition"
      className="dashboard-v3-panel rounded-2xl border border-[#2a2e32] p-4 transition-colors hover:border-amber-400/40"
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400">
        <Apple className="size-5" aria-hidden />
      </div>
      <h3 className="text-sm font-bold uppercase text-white">Nutrición</h3>
      <p className="mt-1 text-xs text-[#9ca3af]">
        {targetKcal
          ? `Objetivo: ${targetKcal.toLocaleString('es-ES')} kcal/día`
          : hasAssignedPlan
            ? 'Ver plan y diario'
            : 'Plan asignado por tu entrenador'}
      </p>
    </Link>
  );
}
