export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type NutritionGoal = 'lose' | 'maintain' | 'gain';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
};

export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export interface MealItem {
  id: string;
  name: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  quantityG?: number;
  scheduledTime?: string;
  notes?: string;
}

export type MealSlotTimes = Record<MealSlot, string>;

export interface DayPlan {
  day: number;
  meals: Record<MealSlot, MealItem[]>;
}

export interface MealPlan {
  id: string;
  name: string;
  days: DayPlan[];
  createdAt: string;
}

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  splitLabel: string;
}

export interface MacroSplitPercent {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLogEntry {
  date: string;
  items: MealItem[];
}

export interface NutritionState {
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  calorieAdjustment: number;
  macroTargets: MacroTargets | null;
  mealPlans: MealPlan[];
  activeMealPlanId: string | null;
  foodLog: FoodLogEntry[];
  waterByDate: Record<string, number>;
  waterGoalMl: number;
  updatedAt: string;
}

export interface MetabolismInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'male' | 'female';
}

export interface MetabolismResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
}

export interface TodayMacroSummary {
  consumed: { calories: number; proteinG: number; carbsG: number; fatG: number };
  targets: MacroTargets | null;
}

export interface WeeklyAdherenceDay {
  date: string;
  label: string;
  withinTarget: boolean;
  calories: number;
  target: number;
}

export interface AssignedNutritionPlan {
  athleteId: string;
  macroTargets: MacroTargets;
  mealPlan: MealPlan;
  slotTimes: MealSlotTimes;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  calorieAdjustment: number;
  publishedAt: string;
  publishedBy: string;
}

export interface AthleteDiaryState {
  foodLog: FoodLogEntry[];
  waterByDate: Record<string, number>;
  waterGoalMl: number;
  updatedAt: string;
}

export interface ShoppingListEntry {
  name: string;
  totalG: number | null;
  gramsPending: boolean;
  occurrences: number;
  slots: MealSlot[];
  times: string[];
}

/** Draft state for coach editing before publish */
export interface CoachNutritionDraft {
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  calorieAdjustment: number;
  macroTargets: MacroTargets | null;
  mealPlans: MealPlan[];
  activeMealPlanId: string | null;
  slotTimes: MealSlotTimes;
  updatedAt: string;
}
