'use client';

import { PlanDayMeals } from '@/components/nutrition/plan-day-meals';
import { WeeklyShoppingList } from '@/components/nutrition/weekly-shopping-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNutrition } from '@/hooks/use-nutrition';
import { createDefaultSlotTimes } from '@/lib/nutrition/meal-schedule';
import { DAY_LABELS, type MealPlan, type MealSlotTimes } from '@/lib/nutrition/types';
import { useState } from 'react';

export function AssignedMealPlanView({
  mealPlan,
  slotTimes,
  emptyMessage,
  subtitle,
}: {
  mealPlan?: MealPlan | null;
  slotTimes?: MealSlotTimes | null;
  emptyMessage?: string;
  subtitle?: string;
}) {
  const { assigned, hasAssignedPlan } = useNutrition();
  const [selectedDay, setSelectedDay] = useState(0);
  const plan = mealPlan ?? assigned?.mealPlan ?? null;
  const times = slotTimes ?? assigned?.slotTimes ?? createDefaultSlotTimes();

  if (!plan || (!mealPlan && !hasAssignedPlan)) {
    return (
      <div className="brand-card rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Plan de alimentación</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {emptyMessage ??
            'Tu entrenador aún no ha publicado tu plan semanal. Cuando lo haga, verás aquí las comidas por día y la lista de compra.'}
        </p>
      </div>
    );
  }

  return (
    <div className="brand-card space-y-6 rounded-2xl p-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Plan de alimentación</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle ??
            `${plan.name} · Publicado el ${new Date(assigned?.publishedAt ?? Date.now()).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`}
        </p>
      </div>

      <Tabs value={String(selectedDay)} onValueChange={(v) => setSelectedDay(Number(v))}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {DAY_LABELS.map((label, i) => (
            <TabsTrigger key={label} value={String(i)} className="text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {plan.days.map((dayPlan) => (
          <TabsContent key={dayPlan.day} value={String(dayPlan.day)} className="space-y-4">
            <PlanDayMeals dayPlan={dayPlan} slotTimes={times} mode="view" />
          </TabsContent>
        ))}
      </Tabs>

      <WeeklyShoppingList mealPlan={plan} slotTimes={times} />
    </div>
  );
}
