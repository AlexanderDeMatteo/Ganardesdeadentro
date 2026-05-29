'use client';

import { CoachNutritionProvider, useCoachNutritionContext } from '@/app/context/coach-nutrition-context';
import { AssignedMacrosView } from '@/components/nutrition/assigned-macros-view';
import { AssignedMealPlanView } from '@/components/nutrition/assigned-meal-plan-view';
import { MacroCalculator } from '@/components/nutrition/macro-calculator';
import { MealPlanEditor } from '@/components/nutrition/meal-plan-editor';
import { MetabolismPanel } from '@/components/nutrition/metabolism-panel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AthleteProfile } from '@/hooks/use-admin';
import { metabolismInputFromAthlete } from '@/lib/nutrition/athlete-metabolism';
import type { MetabolismInput } from '@/lib/nutrition/types';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { LoadingState } from '@/components/ui/loading-state';

function CoachEditorInner({
  athlete,
  backHref,
}: {
  athlete: AthleteProfile;
  backHref: string;
}) {
  const { metabolismInput, getMetabolism, assigned, state, slotTimes, publish, canEdit, isLoading } =
    useCoachNutritionContext();

  const metabolism = getMetabolism(metabolismInput);
  const defaultCalories = metabolism?.targetCalories ?? 2200;

  if (isLoading) {
    return <LoadingState label="Cargando editor nutricional…" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href={backHref}>
              <ArrowLeft className="size-4" aria-hidden />
              Volver a atletas
            </Link>
          </Button>
          <h1 className="text-3xl font-black uppercase tracking-tight">Nutrición · {athlete.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{athlete.email}</p>
          {assigned && (
            <p className="mt-2 text-xs text-muted-foreground">
              Última publicación:{' '}
              {new Date(assigned.publishedAt).toLocaleString('es-ES', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
        <Button type="button" onClick={() => publish()} disabled={!canEdit} className="shrink-0">
          <Save className="size-4" aria-hidden />
          Guardar plan
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Guardar plan publica macros y comidas para que el atleta asignado lo vea en su pestaña Nutrición.
      </p>

      {!canEdit && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-muted-foreground">
          No tienes permiso para editar la nutrición de este atleta.
        </p>
      )}

      <Tabs defaultValue="metabolism" className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="metabolism">Metabolismo</TabsTrigger>
          <TabsTrigger value="macros">Macros</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="preview">Vista previa</TabsTrigger>
        </TabsList>

        <TabsContent value="metabolism" className="space-y-6">
          <MetabolismPanel input={metabolismInput} metabolism={metabolism} />
        </TabsContent>

        <TabsContent value="macros" className="space-y-6">
          <MacroCalculator defaultCalories={defaultCalories} />
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <MealPlanEditor />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {state.macroTargets || state.mealPlans.length > 0
              ? 'Vista previa del borrador actual. Guarda el plan para publicarlo al atleta.'
              : 'Última versión guardada para el atleta.'}
          </p>
          <AssignedMacrosView targets={state.macroTargets ?? assigned?.macroTargets ?? null} />
          <AssignedMealPlanView
            mealPlan={
              state.mealPlans.find((p) => p.id === state.activeMealPlanId) ??
              state.mealPlans[0] ??
              assigned?.mealPlan ??
              null
            }
            slotTimes={slotTimes ?? assigned?.slotTimes ?? null}
            subtitle={
              state.mealPlans.length > 0
                ? 'Borrador actual del plan del atleta'
                : assigned
                  ? 'Último plan guardado para el atleta'
                  : 'Aún no hay plan guardado para este atleta'
            }
            emptyMessage="Aún no has creado un plan en borrador para este atleta."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function NutritionCoachEditor({
  athlete,
  backHref,
}: {
  athlete: AthleteProfile;
  backHref: string;
}) {
  const metabolismInput = useMemo((): MetabolismInput => metabolismInputFromAthlete(athlete), [athlete]);

  return (
    <CoachNutritionProvider athleteId={athlete.id} metabolismInput={metabolismInput}>
      <CoachEditorInner athlete={athlete} backHref={backHref} />
    </CoachNutritionProvider>
  );
}
