import { GOAL_ADJUSTMENTS } from './metabolism';
import type { NutritionState } from './types';

export const NUTRITION_STORAGE_KEY = 'fittrack_nutrition';

export function createDefaultNutritionState(): NutritionState {
  return {
    activityLevel: 'moderate',
    goal: 'maintain',
    calorieAdjustment: GOAL_ADJUSTMENTS.maintain.defaultAdjustment,
    macroTargets: null,
    mealPlans: [],
    activeMealPlanId: null,
    foodLog: [],
    waterByDate: {},
    waterGoalMl: 2500,
    updatedAt: new Date().toISOString(),
  };
}

export function parseNutritionState(raw: string | null): NutritionState {
  if (!raw) return createDefaultNutritionState();
  try {
    const o = JSON.parse(raw) as Partial<NutritionState>;
    const defaults = createDefaultNutritionState();
    return {
      ...defaults,
      ...o,
      mealPlans: Array.isArray(o.mealPlans) ? o.mealPlans : defaults.mealPlans,
      foodLog: Array.isArray(o.foodLog) ? o.foodLog : defaults.foodLog,
      waterByDate: o.waterByDate && typeof o.waterByDate === 'object' ? o.waterByDate : defaults.waterByDate,
      macroTargets: o.macroTargets ?? defaults.macroTargets,
    };
  } catch {
    return createDefaultNutritionState();
  }
}
