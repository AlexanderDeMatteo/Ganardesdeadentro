'use client';

import {
  useCoachNutrition,
  type CoachNutritionContextValue,
} from '@/hooks/use-coach-nutrition';
import type { MetabolismInput } from '@/lib/nutrition/types';
import { createContext, useContext, type ReactNode } from 'react';

const CoachNutritionContext = createContext<CoachNutritionContextValue | null>(null);

export function CoachNutritionProvider({
  athleteId,
  metabolismInput,
  children,
}: {
  athleteId: string;
  metabolismInput: MetabolismInput | null;
  children: ReactNode;
}) {
  const value = useCoachNutrition(athleteId, metabolismInput);
  return (
    <CoachNutritionContext.Provider value={value}>{children}</CoachNutritionContext.Provider>
  );
}

export function useCoachNutritionContext(): CoachNutritionContextValue {
  const ctx = useContext(CoachNutritionContext);
  if (!ctx) {
    throw new Error('useCoachNutritionContext debe usarse dentro de CoachNutritionProvider');
  }
  return ctx;
}
