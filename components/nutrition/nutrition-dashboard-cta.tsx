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
      className="gp-module gp-module-corner block p-4 transition-colors hover:gp-phosphor-glow"
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg gp-bg-surface-variant text-[var(--gp-error-core)]">
        <Apple className="size-5" aria-hidden />
      </div>
      <h3 className="gp-mono text-sm font-bold uppercase gp-text-primary">Nutrición</h3>
      <p className="mt-1 text-xs gp-text-muted">
        {targetKcal
          ? `Objetivo: ${targetKcal.toLocaleString('es-ES')} kcal/día`
          : hasAssignedPlan
            ? 'Ver plan y diario'
            : 'Plan asignado por tu entrenador'}
      </p>
    </Link>
  );
}
