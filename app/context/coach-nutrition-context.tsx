'use client';

import {
  useCoachNutrition,
  type CoachNutritionContextValue,
} from '@/hooks/use-coach-nutrition';
import type { Athlete } from '@/lib/data/types';
import type { MetabolismInput } from '@/lib/nutrition/types';
import { createContext, useContext, type ReactNode } from 'react';

const CoachNutritionContext = createContext<CoachNutritionContextValue | null>(null);

export function CoachNutritionProvider({
  athleteId,
  metabolismInput,
  athlete,
  children,
}: {
  athleteId: string;
  metabolismInput: MetabolismInput | null;
  athlete?: Athlete | null;
  children: ReactNode;
}) {
  const value = useCoachNutrition(athleteId, metabolismInput, athlete);
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
