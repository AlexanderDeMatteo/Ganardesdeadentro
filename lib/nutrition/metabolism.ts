import type { ActivityLevel, MetabolismInput, MetabolismResult, NutritionGoal } from './types';

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentario' },
  light: { factor: 1.375, label: 'Ligero' },
  moderate: { factor: 1.55, label: 'Moderado' },
  active: { factor: 1.725, label: 'Intenso' },
  very_active: { factor: 1.9, label: 'Muy intenso' },
};

export const GOAL_ADJUSTMENTS: Record<NutritionGoal, { defaultAdjustment: number; label: string }> = {
  lose: { defaultAdjustment: -500, label: 'Déficit' },
  maintain: { defaultAdjustment: 0, label: 'Mantenimiento' },
  gain: { defaultAdjustment: 300, label: 'Superávit' },
};

/** Mifflin-St Jeor BMR (kcal/día). */
export function calculateBmr(input: MetabolismInput): number {
  const { weightKg, heightCm, age, sex } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === 'male' ? base + 5 : base - 161;
  return Math.round(Math.max(800, bmr));
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel].factor);
}

export function calculateTargetCalories(tdee: number, calorieAdjustment: number): number {
  return Math.round(Math.max(1200, Math.min(6000, tdee + calorieAdjustment)));
}

export function computeMetabolism(
  input: MetabolismInput,
  activityLevel: ActivityLevel,
  calorieAdjustment: number,
): MetabolismResult {
  const bmr = calculateBmr(input);
  const tdee = calculateTdee(bmr, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, calorieAdjustment);
  return { bmr, tdee, targetCalories };
}
