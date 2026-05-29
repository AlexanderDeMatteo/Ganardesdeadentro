'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { TodayMacroSummary } from '@/lib/nutrition/types';
import { Flame, Target, Zap } from 'lucide-react';

function MacroBar({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-foreground">
          {Math.round(current)} / {target > 0 ? Math.round(target) : '—'} {unit}
        </span>
      </div>
      <Progress value={pct} className="h-2" aria-label={`${label}: ${pct}% del objetivo`} />
    </div>
  );
}

export function NutritionSummary({
  today,
  targetCalories,
  hasAssignedPlan,
  onGoToDiary,
}: {
  today: TodayMacroSummary;
  targetCalories: number | null;
  hasAssignedPlan: boolean;
  onGoToDiary?: () => void;
}) {
  const goalKcal = today.targets?.calories ?? targetCalories ?? 0;
  const consumedKcal = today.consumed.calories;
  const kcalPct = goalKcal > 0 ? Math.min(100, Math.round((consumedKcal / goalKcal) * 100)) : 0;
  const hasNoIntake =
    today.consumed.calories === 0 &&
    today.consumed.proteinG === 0 &&
    today.consumed.carbsG === 0 &&
    today.consumed.fatG === 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="brand-card rounded-2xl p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <Zap className="size-4 text-primary" aria-hidden />
          Objetivo del plan
        </div>
        <p className="text-3xl font-black text-foreground">
          {hasAssignedPlan && goalKcal > 0 ? goalKcal.toLocaleString('es-ES') : '—'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">kcal/día asignadas</p>
      </div>
      <div className="brand-card rounded-2xl p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <Flame className="size-4 text-secondary" aria-hidden />
          Macros activos
        </div>
        <p className="text-3xl font-black text-foreground">
          {today.targets ? (
            <>
              P {today.targets.proteinG}g
            </>
          ) : (
            '—'
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {today.targets ? `C ${today.targets.carbsG}g · G ${today.targets.fatG}g` : 'Pendiente de publicación'}
        </p>
      </div>
      <button
        type="button"
        onClick={onGoToDiary}
        className="brand-card min-h-[44px] w-full rounded-2xl p-5 text-left transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Ver diario de hoy"
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <Target className="size-4 text-accent" aria-hidden />
          Hoy
        </div>
        <p className="text-3xl font-black text-foreground">
          {consumedKcal.toLocaleString('es-ES')}
          <span className="text-lg text-muted-foreground"> / {goalKcal > 0 ? goalKcal : '—'}</span>
        </p>
        <Progress value={kcalPct} className="mt-3 h-2" aria-label={`Calorías del día: ${kcalPct}%`} />
      </button>

      {today.targets && (
        <div className="brand-card col-span-full space-y-3 rounded-2xl p-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Macros del día ({today.targets.splitLabel})
          </p>
          {hasNoIntake ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Aún no hay registros hoy.</p>
              <Button type="button" className="min-h-[44px]" onClick={onGoToDiary}>
                Registrar en el diario
              </Button>
            </div>
          ) : null}
          <MacroBar label="Proteína" current={today.consumed.proteinG} target={today.targets.proteinG} unit="g" />
          <MacroBar label="Carbos" current={today.consumed.carbsG} target={today.targets.carbsG} unit="g" />
          <MacroBar label="Grasas" current={today.consumed.fatG} target={today.targets.fatG} unit="g" />
        </div>
      )}
    </div>
  );
}
