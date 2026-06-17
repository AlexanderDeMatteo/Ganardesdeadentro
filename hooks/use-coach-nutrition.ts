'use client';

import { useAuth } from '@/app/context/auth-context';
import {
  getCoachNutritionDraft,
  getMealPlan,
  publishMealPlan,
  saveCoachNutritionDraft,
} from '@/lib/data/client';
import { createDefaultCoachDraft } from '@/lib/nutrition/assigned-storage';
import { normalizeActivityLevel } from '@/lib/nutrition/activity-level';
import { createEmptyWeekPlan } from '@/lib/nutrition/meal-plan';
import { computeMetabolism, GOAL_ADJUSTMENTS } from '@/lib/nutrition/metabolism';
import { useAthleteForCoach } from '@/hooks/use-athlete-for-coach';
import { findAthleteById } from '@/lib/nutrition/resolve-athlete-id';
import { isApiAuthSource, isApiUsersSource } from '@/lib/api/config';
import type { Athlete } from '@/lib/data/types';
import type {
  AssignedNutritionPlan,
  CoachNutritionDraft,
  MacroTargets,
  MealPlan,
  MealSlotTimes,
  MetabolismInput,
  MetabolismResult,
} from '@/lib/nutrition/types';
import { canCoachEditAthlete, resolveTrainerId } from '@/lib/auth/guards';
import { isProMember as checkProMember } from '@/lib/auth/titan';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export { canCoachEditAthlete };

export function useCoachNutrition(
  athleteId: string,
  metabolismInput: MetabolismInput | null,
  athleteOverride?: Athlete | null,
) {
  const { user } = useAuth();
  const apiMode = isApiAuthSource() || isApiUsersSource();
  const { athlete: fetchedAthlete } = useAthleteForCoach(athleteId);
  const athlete = useMemo(() => {
    if (athleteOverride) return athleteOverride;
    if (apiMode) return fetchedAthlete;
    return findAthleteById(athleteId);
  }, [athleteOverride, apiMode, fetchedAthlete, athleteId]);
  const trainerScopeId = resolveTrainerId(user);
  const canEdit = useMemo(
    () => canCoachEditAthlete(user?.role, trainerScopeId, athlete?.trainerId),
    [user?.role, trainerScopeId, athlete?.trainerId],
  );

  const [draft, setDraft] = useState<CoachNutritionDraft>(createDefaultCoachDraft);
  const [assigned, setAssigned] = useState<AssignedNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isProMember = checkProMember(user) || user?.role === 'trainer' || user?.role === 'admin';
  const maxPlans = isProMember ? Infinity : 1;
  const canAddMealPlan = isProMember || draft.mealPlans.length < maxPlans;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [loadedDraft, loadedPlan] = await Promise.all([
        getCoachNutritionDraft(athleteId),
        getMealPlan(athleteId),
      ]);
      if (!cancelled) {
        setDraft({
          ...loadedDraft,
          activityLevel: normalizeActivityLevel(loadedDraft.activityLevel),
        });
        setAssigned(loadedPlan);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId]);

  const persistDraftSave = useCallback(
    (next: CoachNutritionDraft) => {
      saveCoachNutritionDraft(athleteId, next).catch(() => {
        toast.error('No se pudo guardar el borrador nutricional');
      });
    },
    [athleteId],
  );

  const persistDraft = useCallback(
    async (next: CoachNutritionDraft) => {
      setDraft(next);
      try {
        await saveCoachNutritionDraft(athleteId, next);
      } catch {
        toast.error('No se pudo guardar el borrador nutricional');
        throw new Error('saveCoachNutritionDraft failed');
      }
    },
    [athleteId],
  );

  const updateDraft = useCallback(
    (updater: (prev: CoachNutritionDraft) => CoachNutritionDraft) => {
      setDraft((prev) => {
        const next = updater(prev);
        persistDraftSave(next);
        return next;
      });
    },
    [persistDraftSave],
  );

  const saveSettings = useCallback(
    (patch: Partial<Pick<CoachNutritionDraft, 'activityLevel' | 'goal' | 'calorieAdjustment'>>) => {
      updateDraft((prev) => {
        const goal = patch.goal ?? prev.goal;
        let calorieAdjustment = patch.calorieAdjustment ?? prev.calorieAdjustment;
        if (patch.goal && patch.calorieAdjustment === undefined) {
          calorieAdjustment = GOAL_ADJUSTMENTS[goal].defaultAdjustment;
        }
        return { ...prev, ...patch, goal, calorieAdjustment };
      });
    },
    [updateDraft],
  );

  const setMacroTargets = useCallback(
    (targets: MacroTargets | null) => {
      updateDraft((prev) => ({ ...prev, macroTargets: targets }));
    },
    [updateDraft],
  );

  const saveMacroTargets = useCallback(
    async (targets: MacroTargets | null) => {
      const next = { ...draft, macroTargets: targets };
      await persistDraft(next);
    },
    [draft, persistDraft],
  );

  const setSlotTimes = useCallback(
    (slotTimes: MealSlotTimes) => {
      updateDraft((prev) => ({ ...prev, slotTimes }));
    },
    [updateDraft],
  );

  const upsertMealPlan = useCallback(
    (plan: MealPlan) => {
      updateDraft((prev) => {
        const exists = prev.mealPlans.some((p) => p.id === plan.id);
        const mealPlans = exists
          ? prev.mealPlans.map((p) => (p.id === plan.id ? plan : p))
          : [...prev.mealPlans, plan];
        return {
          ...prev,
          mealPlans,
          activeMealPlanId: prev.activeMealPlanId ?? plan.id,
        };
      });
    },
    [updateDraft],
  );

  const deleteMealPlan = useCallback(
    (id: string) => {
      updateDraft((prev) => ({
        ...prev,
        mealPlans: prev.mealPlans.filter((p) => p.id !== id),
        activeMealPlanId: prev.activeMealPlanId === id ? null : prev.activeMealPlanId,
      }));
    },
    [updateDraft],
  );

  const setActiveMealPlan = useCallback(
    (id: string | null) => {
      updateDraft((prev) => ({ ...prev, activeMealPlanId: id }));
    },
    [updateDraft],
  );

  const getMetabolism = useCallback(
    (input: MetabolismInput | null): MetabolismResult | null => {
      if (!input) return null;
      return computeMetabolism(input, draft.activityLevel, draft.calorieAdjustment);
    },
    [draft.activityLevel, draft.calorieAdjustment],
  );

  const publish = useCallback(
    async (options?: { macroTargets?: MacroTargets | null }) => {
      if (!canEdit) {
        toast.error('No tienes permiso para publicar el plan de este atleta.');
        return false;
      }
      const macroTargets = options?.macroTargets ?? draft.macroTargets;
      if (!macroTargets) {
        toast.error('Define y aplica los macros objetivo antes de publicar.');
        return false;
      }

      const draftMealPlan =
        draft.mealPlans.find((p) => p.id === draft.activeMealPlanId) ?? draft.mealPlans[0] ?? null;
      const mealPlan = draftMealPlan ?? assigned?.mealPlan ?? createEmptyWeekPlan('Plan base');

      const publishedBy =
        user?.role === 'trainer' ? trainerScopeId : (user?.id ?? 'admin');

      const plan: AssignedNutritionPlan = {
        athleteId,
        macroTargets,
        mealPlan,
        slotTimes: draft.slotTimes,
        activityLevel: normalizeActivityLevel(draft.activityLevel),
        goal: draft.goal,
        calorieAdjustment: draft.calorieAdjustment,
        publishedAt: new Date().toISOString(),
        publishedBy,
      };

      try {
        const published = await publishMealPlan(plan);
        setAssigned(published);
        toast.success('Plan nutricional publicado para el atleta.');
        return true;
      } catch {
        toast.error('No se pudo publicar el plan nutricional');
        return false;
      }
    },
    [athleteId, assigned, canEdit, draft, user, trainerScopeId],
  );

  const state = useMemo(
    () => ({
      activityLevel: draft.activityLevel,
      goal: draft.goal,
      calorieAdjustment: draft.calorieAdjustment,
      macroTargets: draft.macroTargets,
      mealPlans: draft.mealPlans,
      activeMealPlanId: draft.activeMealPlanId,
      foodLog: [] as never[],
      waterByDate: {} as Record<string, number>,
      waterGoalMl: 2500,
      updatedAt: draft.updatedAt,
    }),
    [draft],
  );

  return {
    athlete,
    canEdit,
    draft,
    assigned,
    state,
    slotTimes: draft.slotTimes,
    isLoading,
    isProMember,
    canAddMealPlan,
    saveSettings,
    setMacroTargets,
    saveMacroTargets,
    setSlotTimes,
    upsertMealPlan,
    deleteMealPlan,
    setActiveMealPlan,
    getMetabolism,
    publish,
    persistDraft,
    metabolismInput,
  };
}

export type CoachNutritionContextValue = ReturnType<typeof useCoachNutrition>;
