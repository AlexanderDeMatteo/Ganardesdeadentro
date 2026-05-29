import { createDefaultSlotTimes } from './meal-schedule';
import type { AssignedNutritionPlan, CoachNutritionDraft, MealSlotTimes } from './types';
import { GOAL_ADJUSTMENTS } from './metabolism';
import type { ActivityLevel, NutritionGoal } from './types';

export function assignedStorageKey(athleteId: string): string {
  return `fittrack_nutrition_assigned_${athleteId}`;
}

export function coachDraftStorageKey(athleteId: string): string {
  return `fittrack_nutrition_coach_draft_${athleteId}`;
}

export function createDefaultCoachDraft(): CoachNutritionDraft {
  return {
    activityLevel: 'moderate',
    goal: 'maintain',
    calorieAdjustment: GOAL_ADJUSTMENTS.maintain.defaultAdjustment,
    macroTargets: null,
    mealPlans: [],
    activeMealPlanId: null,
    slotTimes: createDefaultSlotTimes(),
    updatedAt: new Date().toISOString(),
  };
}

export function parseAssignedPlan(raw: string | null): AssignedNutritionPlan | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<AssignedNutritionPlan>;
    if (!o.athleteId || !o.macroTargets || !o.mealPlan) return null;
    return {
      athleteId: o.athleteId,
      macroTargets: o.macroTargets,
      mealPlan: o.mealPlan,
      slotTimes: o.slotTimes ?? createDefaultSlotTimes(),
      activityLevel: (o.activityLevel ?? 'moderate') as ActivityLevel,
      goal: (o.goal ?? 'maintain') as NutritionGoal,
      calorieAdjustment: o.calorieAdjustment ?? 0,
      publishedAt: o.publishedAt ?? new Date().toISOString(),
      publishedBy: o.publishedBy ?? '',
    };
  } catch {
    return null;
  }
}

export function parseCoachDraft(raw: string | null): CoachNutritionDraft {
  if (!raw) return createDefaultCoachDraft();
  try {
    const o = JSON.parse(raw) as Partial<CoachNutritionDraft>;
    const defaults = createDefaultCoachDraft();
    return {
      ...defaults,
      ...o,
      mealPlans: Array.isArray(o.mealPlans) ? o.mealPlans : defaults.mealPlans,
      slotTimes: o.slotTimes ?? defaults.slotTimes,
      macroTargets: o.macroTargets ?? defaults.macroTargets,
    };
  } catch {
    return createDefaultCoachDraft();
  }
}

export function loadAssignedPlan(athleteId: string): AssignedNutritionPlan | null {
  if (typeof window === 'undefined') return null;
  return parseAssignedPlan(localStorage.getItem(assignedStorageKey(athleteId)));
}

export function saveAssignedPlan(plan: AssignedNutritionPlan): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(assignedStorageKey(plan.athleteId), JSON.stringify(plan));
  } catch {
    /* quota */
  }
}

export function loadCoachDraft(athleteId: string): CoachNutritionDraft {
  if (typeof window === 'undefined') return createDefaultCoachDraft();
  return parseCoachDraft(localStorage.getItem(coachDraftStorageKey(athleteId)));
}

export function saveCoachDraft(athleteId: string, draft: CoachNutritionDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      coachDraftStorageKey(athleteId),
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota */
  }
}

export function slotTimesFromDraft(draft: CoachNutritionDraft): MealSlotTimes {
  return draft.slotTimes ?? createDefaultSlotTimes();
}
