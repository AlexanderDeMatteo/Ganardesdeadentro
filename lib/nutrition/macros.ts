import type { MacroSplitPercent, MacroTargets } from './types';

export type MacroPresetId = 'balanced' | 'high_protein' | 'low_carb' | 'keto' | 'custom';

export interface MacroPreset {
  id: MacroPresetId;
  label: string;
  split: MacroSplitPercent;
}

export const MACRO_PRESETS: MacroPreset[] = [
  { id: 'balanced', label: 'Equilibrado (30/40/30)', split: { protein: 30, carbs: 40, fat: 30 } },
  { id: 'high_protein', label: 'Alto en proteína (40/30/30)', split: { protein: 40, carbs: 30, fat: 30 } },
  { id: 'low_carb', label: 'Bajo en carbos (35/25/40)', split: { protein: 35, carbs: 25, fat: 40 } },
  { id: 'keto', label: 'Keto aprox. (25/5/70)', split: { protein: 25, carbs: 5, fat: 70 } },
];

export function isValidMacroSplit(split: MacroSplitPercent): boolean {
  const sum = split.protein + split.carbs + split.fat;
  if (Math.abs(sum - 100) > 0.5) return false;
  return [split.protein, split.carbs, split.fat].every((p) => p >= 5 && p <= 70);
}

export function clampCalories(calories: number): number {
  return Math.round(Math.max(1200, Math.min(6000, calories)));
}

export function macrosFromCalories(calories: number, split: MacroSplitPercent, splitLabel: string): MacroTargets {
  const kcal = clampCalories(calories);
  return {
    calories: kcal,
    proteinG: Math.round((kcal * (split.protein / 100)) / 4),
    carbsG: Math.round((kcal * (split.carbs / 100)) / 4),
    fatG: Math.round((kcal * (split.fat / 100)) / 9),
    splitLabel,
  };
}

export function sumMealItemMacros(
  items: { calories?: number; proteinG?: number; carbsG?: number; fatG?: number }[],
): { calories: number; proteinG: number; carbsG: number; fatG: number } {
  return items.reduce<{ calories: number; proteinG: number; carbsG: number; fatG: number }>(
    (acc, item) => ({
      calories: acc.calories + (item.calories ?? 0),
      proteinG: acc.proteinG + (item.proteinG ?? 0),
      carbsG: acc.carbsG + (item.carbsG ?? 0),
      fatG: acc.fatG + (item.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}
