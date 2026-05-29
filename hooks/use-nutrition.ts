'use client';

import { useAuth } from '@/app/context/auth-context';
import { getMealPlan } from '@/lib/data/client';
import { getWeeklyAdherence } from '@/lib/nutrition/adherence';
import { toLocalDateKey } from '@/lib/nutrition/dates';
import {
  createDefaultDiaryState,
  loadDiaryState,
  migrateLegacyDiaryIfNeeded,
  saveDiaryState,
} from '@/lib/nutrition/diary-storage';
import { sumMealItemMacros } from '@/lib/nutrition/macros';
import { computeMetabolism } from '@/lib/nutrition/metabolism';
import { resolveAthleteId } from '@/lib/nutrition/resolve-athlete-id';
import type {
  ActivityLevel,
  AssignedNutritionPlan,
  AthleteDiaryState,
  MacroTargets,
  MealItem,
  MetabolismInput,
  MetabolismResult,
  TodayMacroSummary,
} from '@/lib/nutrition/types';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { hasTitanNutritionAccess, isProMember } from '@/lib/auth/titan';

export type NutritionContextValue = {
  athleteId: string | null;
  assigned: AssignedNutritionPlan | null;
  hasAssignedPlan: boolean;
  diary: AthleteDiaryState;
  isLoading: boolean;
  logFoodItem: (item: Omit<MealItem, 'id'>, date?: string) => void;
  removeFoodItem: (itemId: string, date?: string) => void;
  addWater: (ml: number, date?: string) => void;
  setWaterGoalMl: (ml: number) => void;
  getTodaySummary: () => TodayMacroSummary;
  getWeeklyAdherence: () => ReturnType<typeof getWeeklyAdherence>;
  getMetabolism: (input: MetabolismInput | null) => MetabolismResult | null;
  macroTargets: MacroTargets | null;
  isProMember: boolean;
  hasTitanNutritionAccess: boolean;
};

const NutritionContext = createContext<NutritionContextValue | null>(null);

function useNutritionStore(): NutritionContextValue {
  const { user } = useAuth();
  const athleteId = useMemo(() => resolveAthleteId(user), [user]);
  const [assigned, setAssigned] = useState<AssignedNutritionPlan | null>(null);
  const [diary, setDiary] = useState<AthleteDiaryState>(createDefaultDiaryState);
  const [isLoading, setIsLoading] = useState(true);

  const proMember = isProMember(user);
  const titanNutritionAccess = hasTitanNutritionAccess(user);

  useEffect(() => {
    if (!athleteId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const plan = await getMealPlan(athleteId);
      if (!cancelled) {
        setAssigned(plan);
        setDiary(migrateLegacyDiaryIfNeeded(athleteId));
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId]);

  const refreshAssigned = useCallback(async () => {
    if (!athleteId) return;
    const plan = await getMealPlan(athleteId);
    setAssigned(plan);
  }, [athleteId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!athleteId) return;
      if (e.key?.includes(`fittrack_nutrition_assigned_${athleteId}`)) {
        refreshAssigned();
      }
    };
    const onPublished = (e: Event) => {
      const detail = (e as CustomEvent<{ athleteId?: string }>).detail;
      if (!athleteId || detail?.athleteId === athleteId) {
        refreshAssigned();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('fittrack-nutrition-published', onPublished);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('fittrack-nutrition-published', onPublished);
    };
  }, [athleteId, refreshAssigned]);

  const updateDiary = useCallback(
    (updater: (prev: AthleteDiaryState) => AthleteDiaryState) => {
      if (!athleteId) return;
      setDiary((prev) => {
        const next = updater(prev);
        saveDiaryState(athleteId, next);
        return next;
      });
    },
    [athleteId],
  );

  const logFoodItem = useCallback(
    (item: Omit<MealItem, 'id'>, date?: string) => {
      const dateKey = date ?? toLocalDateKey();
      const newItem: MealItem = {
        ...item,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      updateDiary((prev) => {
        const idx = prev.foodLog.findIndex((e) => e.date === dateKey);
        const foodLog = [...prev.foodLog];
        if (idx >= 0) {
          foodLog[idx] = { ...foodLog[idx], items: [...foodLog[idx].items, newItem] };
        } else {
          foodLog.push({ date: dateKey, items: [newItem] });
        }
        return { ...prev, foodLog };
      });
    },
    [updateDiary],
  );

  const removeFoodItem = useCallback(
    (itemId: string, date?: string) => {
      const dateKey = date ?? toLocalDateKey();
      updateDiary((prev) => ({
        ...prev,
        foodLog: prev.foodLog
          .map((e) =>
            e.date === dateKey ? { ...e, items: e.items.filter((i) => i.id !== itemId) } : e,
          )
          .filter((e) => e.items.length > 0),
      }));
    },
    [updateDiary],
  );

  const addWater = useCallback(
    (ml: number, date?: string) => {
      const dateKey = date ?? toLocalDateKey();
      updateDiary((prev) => ({
        ...prev,
        waterByDate: {
          ...prev.waterByDate,
          [dateKey]: Math.max(0, (prev.waterByDate[dateKey] ?? 0) + ml),
        },
      }));
    },
    [updateDiary],
  );

  const setWaterGoalMl = useCallback(
    (ml: number) => {
      updateDiary((prev) => ({ ...prev, waterGoalMl: ml }));
    },
    [updateDiary],
  );

  const macroTargets = assigned?.macroTargets ?? null;

  const getTodaySummary = useCallback((): TodayMacroSummary => {
    const today = toLocalDateKey();
    const entry = diary.foodLog.find((e) => e.date === today);
    const consumed = sumMealItemMacros(entry?.items ?? []);
    return { consumed, targets: macroTargets };
  }, [diary.foodLog, macroTargets]);

  const getWeeklyAdherenceFn = useCallback(() => {
    return getWeeklyAdherence(diary.foodLog, macroTargets?.calories ?? null);
  }, [diary.foodLog, macroTargets]);

  const getMetabolism = useCallback(
    (input: MetabolismInput | null): MetabolismResult | null => {
      if (!input || !assigned) return null;
      return computeMetabolism(
        input,
        assigned.activityLevel,
        assigned.calorieAdjustment,
      );
    },
    [assigned],
  );

  return useMemo(
    () => ({
      athleteId,
      assigned,
      hasAssignedPlan: assigned != null,
      diary,
      isLoading,
      logFoodItem,
      removeFoodItem,
      addWater,
      setWaterGoalMl,
      getTodaySummary,
      getWeeklyAdherence: getWeeklyAdherenceFn,
      getMetabolism,
      macroTargets,
      isProMember: proMember,
      hasTitanNutritionAccess: titanNutritionAccess,
    }),
    [
      athleteId,
      assigned,
      diary,
      isLoading,
      logFoodItem,
      removeFoodItem,
      addWater,
      setWaterGoalMl,
      getTodaySummary,
      getWeeklyAdherenceFn,
      getMetabolism,
      macroTargets,
      proMember,
      titanNutritionAccess,
    ],
  );
}

export function NutritionProvider({ children }: { children: ReactNode }) {
  const value = useNutritionStore();
  return createElement(NutritionContext.Provider, { value }, children);
}

export function useNutrition(): NutritionContextValue {
  const ctx = useContext(NutritionContext);
  if (!ctx) {
    throw new Error('useNutrition debe usarse dentro de NutritionProvider');
  }
  return ctx;
}

export type { ActivityLevel, MacroTargets, MealItem };
