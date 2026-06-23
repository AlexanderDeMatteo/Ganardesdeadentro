'use client';

import { AdherenceChart } from '@/components/nutrition/adherence-chart';
import { AssignedMacrosView } from '@/components/nutrition/assigned-macros-view';
import { AssignedMealPlanView } from '@/components/nutrition/assigned-meal-plan-view';
import { FoodDiary } from '@/components/nutrition/food-diary';
import { NutritionSummary } from '@/components/nutrition/nutrition-summary';
import { NutritionUnassignedAlert } from '@/components/nutrition/nutrition-unassigned-alert';
import { WaterTracker } from '@/components/nutrition/water-tracker';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNutrition } from '@/hooks/use-nutrition';
import { clampDateKeyToLast7Days, isDateKeyOnOrBeforeToday, toLocalDateKey } from '@/lib/nutrition/dates';
import { LoadingState } from '@/components/ui/loading-state';
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary';
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
    <div className="space-y-6">
      <NutritionUnassignedAlert />

      <PrimeModule modId="N00" title="RESUMEN_DIARIO">
        <div className="p-4">
          <NutritionSummary {...summaryProps} onGoToDiary={() => goToDiary({ focusForm: true })} />
        </div>
      </PrimeModule>

      <p className="gp-mono text-xs italic gp-text-dim">
        Plan asignado por tu entrenador. El diario es orientativo y no sustituye asesoría profesional.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 gp-bg-surface-variant">
          <TabsTrigger value="macros" className="gp-mono text-xs">Macros</TabsTrigger>
          <TabsTrigger value="plan" className="gp-mono text-xs">Plan</TabsTrigger>
          <TabsTrigger value="diary" className="gp-mono text-xs">Diario</TabsTrigger>
        </TabsList>

        <TabsContent value="macros" className="space-y-6">
          <PrimeModule modId="N01" title="MACROS_OBJETIVO">
            <div className="p-4">
              <AssignedMacrosView />
            </div>
          </PrimeModule>
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <PrimeModule modId="N02" title="PLAN_COMIDAS">
            <div className="p-4">
              <SectionErrorBoundary
                fallbackTitle="No se pudo cargar el plan de comidas"
                fallbackMessage="El plan asignado tiene un formato incompatible. Contacta a tu entrenador o intenta de nuevo más tarde."
              >
                <AssignedMealPlanView />
              </SectionErrorBoundary>
            </div>
          </PrimeModule>
        </TabsContent>

        <TabsContent value="diary" className="space-y-6">
          <PrimeModule modId="N03" title="DIARIO_ALIMENTOS">
            <div className="grid gap-6 p-4 lg:grid-cols-2">
              <FoodDiary date={selectedDiaryDate} onDateChange={selectDiaryDate} formRef={diaryFormRef} />
              <WaterTracker />
            </div>
          </PrimeModule>
          <PrimeModule modId="N04" title="ADHERENCIA">
            <div className="p-4">
              <AdherenceChart selectedDate={selectedDiaryDate} onSelectDate={selectDiaryDate} />
            </div>
          </PrimeModule>
        </TabsContent>
      </Tabs>
    </div>
  );
}
