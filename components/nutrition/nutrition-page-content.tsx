'use client';

import { AdherenceChart } from '@/components/nutrition/adherence-chart';
import { AssignedMacrosView } from '@/components/nutrition/assigned-macros-view';
import { AssignedMealPlanView } from '@/components/nutrition/assigned-meal-plan-view';
import { FoodDiary } from '@/components/nutrition/food-diary';
import { NutritionSummary } from '@/components/nutrition/nutrition-summary';
import { NutritionUnassignedAlert } from '@/components/nutrition/nutrition-unassigned-alert';
import { WaterTracker } from '@/components/nutrition/water-tracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNutrition } from '@/hooks/use-nutrition';
import { clampDateKeyToLast7Days, isDateKeyOnOrBeforeToday, toLocalDateKey } from '@/lib/nutrition/dates';
import { LoadingState } from '@/components/ui/loading-state';
import { useMemo, useRef, useState } from 'react';

export function NutritionPageContent() {
  const { getTodaySummary, isLoading, assigned, hasAssignedPlan } = useNutrition();
  const [activeTab, setActiveTab] = useState('macros');
  const [selectedDiaryDate, setSelectedDiaryDate] = useState(() => toLocalDateKey());
  const diaryFormRef = useRef<HTMLInputElement>(null);

  const today = getTodaySummary();
  const targetCalories = assigned?.macroTargets?.calories ?? null;

  const summaryProps = useMemo(
    () => ({
      today,
      targetCalories,
      hasAssignedPlan,
    }),
    [today, targetCalories, hasAssignedPlan],
  );

  if (isLoading) {
    return <LoadingState label="Cargando nutrición…" />;
  }

  const goToDiary = (options?: { focusForm?: boolean }) => {
    setActiveTab('diary');
    if (options?.focusForm) {
      requestAnimationFrame(() => {
        diaryFormRef.current?.focus();
      });
    }
  };

  const selectDiaryDate = (date: string) => {
    if (!isDateKeyOnOrBeforeToday(date)) return;
    setSelectedDiaryDate(clampDateKeyToLast7Days(date));
    if (activeTab !== 'diary') setActiveTab('diary');
  };

  return (
    <div className="space-y-8">
      <NutritionUnassignedAlert />

      <NutritionSummary {...summaryProps} onGoToDiary={() => goToDiary({ focusForm: true })} />

      <p className="text-xs text-muted-foreground italic">
        Plan asignado por tu entrenador. El diario es orientativo y no sustituye asesoría profesional.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="macros">Macros</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="diary">Diario</TabsTrigger>
        </TabsList>

        <TabsContent value="macros" className="space-y-6">
          <AssignedMacrosView />
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <AssignedMealPlanView />
        </TabsContent>

        <TabsContent value="diary" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <FoodDiary date={selectedDiaryDate} onDateChange={selectDiaryDate} formRef={diaryFormRef} />
            <WaterTracker />
          </div>
          <AdherenceChart selectedDate={selectedDiaryDate} onSelectDate={selectDiaryDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
