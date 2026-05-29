'use client';

import { useNutrition } from '@/hooks/use-nutrition';
import type { MacroTargets } from '@/lib/nutrition/types';
import { LoadingState } from '@/components/ui/loading-state';

function MacroCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-black">
        {value}
        {unit ? ` ${unit}` : ''}
      </p>
    </div>
  );
}

function MacrosDisplay({ active }: { active: MacroTargets }) {
  return (
    <div className="brand-card space-y-6 rounded-2xl p-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Macros objetivo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan asignado por tu entrenador · {active.splitLabel}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MacroCard label="kcal" value={active.calories} unit="" />
        <MacroCard label="Proteína" value={active.proteinG} unit="g" />
        <MacroCard label="Carbos" value={active.carbsG} unit="g" />
        <MacroCard label="Grasas" value={active.fatG} unit="g" />
      </div>
      <p className="text-xs text-muted-foreground">
        Distribución diaria recomendada. Registra lo que comes en la pestaña Diario para comparar.
      </p>
    </div>
  );
}

function AthleteAssignedMacros() {
  const { macroTargets, hasAssignedPlan, isLoading } = useNutrition();

  if (isLoading) {
    return <LoadingState label="Cargando macros…" rows={2} />;
  }

  if (!hasAssignedPlan || !macroTargets) {
    return (
      <div className="brand-card rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Macros objetivo</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu entrenador aún no ha publicado tus objetivos de macros. Cuando lo haga, los verás aquí.
        </p>
      </div>
    );
  }

  return <MacrosDisplay active={macroTargets} />;
}

/** targets: pass from coach preview; omit on athlete /nutrition */
export function AssignedMacrosView({ targets }: { targets?: MacroTargets | null }) {
  if (targets !== undefined) {
    if (!targets) {
      return (
        <div className="brand-card rounded-2xl p-6">
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Macros objetivo</h2>
          <p className="mt-3 text-sm text-muted-foreground">Sin macros publicados aún.</p>
        </div>
      );
    }
    return <MacrosDisplay active={targets} />;
  }
  return <AthleteAssignedMacros />;
}
