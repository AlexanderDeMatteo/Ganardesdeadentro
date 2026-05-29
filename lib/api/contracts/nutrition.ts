import type { AssignedNutritionPlan, CoachNutritionDraft } from '@/lib/nutrition/types';

export interface MealPlanQuery {
  athleteId: string;
}

export type MealPlanResponse = AssignedNutritionPlan | null;

export type PublishMealPlanRequest = AssignedNutritionPlan;

export type PublishMealPlanResponse = AssignedNutritionPlan;

export interface CoachDraftQuery {
  athleteId: string;
}

export type CoachDraftResponse = CoachNutritionDraft;

export type SaveCoachDraftRequest = {
  athleteId: string;
  draft: CoachNutritionDraft;
};

export type SaveCoachDraftResponse = CoachNutritionDraft;
