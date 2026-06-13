'use client';

import { useAuth } from '@/app/context/auth-context';
import { isApiNutritionSource } from '@/lib/api/config';
import {
  addDiaryEntry,
  deleteDiaryEntry,
  getDiary,
  getMealPlan,
  patchDiaryWater,
  putDiary,
} from '@/lib/data/client';
import { getWeeklyAdherence } from '@/lib/nutrition/adherence';
import { toLocalDateKey } from '@/lib/nutrition/dates';
import {
  createDefaultDiaryState,
  diaryStorageKey,
  migrateLegacyDiaryIfNeeded,
} from '@/lib/nutrition/diary-storage';
import { sumMealItemMacros } from '@/lib/nutrition/macros';
import { computeMetabolism } from '@/lib/nutrition/metabolism';
import { resolveAthleteId } from '@/lib/nutrition/resolve-athlete-id';
import { toast } from 'sonner';
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

function hasLocalDiaryData(athleteId: string): boolean {
  if (typeof window === 'undefined') return false;
  const state = migrateLegacyDiaryIfNeeded(athleteId);
  return state.foodLog.length > 0 || Object.keys(state.waterByDate).length > 0;
}

function clearLocalDiary(athleteId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(diaryStorageKey(athleteId));
  } catch {
    /* ignore */
  }
}

function useNutritionStore(): NutritionContextValue {
  const { user } = useAuth();
  const athleteId = useMemo(() => resolveAthleteId(user), [user]);
  const apiNutritionMode = isApiNutritionSource();
  const [assigned, setAssigned] = useState<AssignedNutritionPlan | null>(null);
  const [diary, setDiary] = useState<AthleteDiaryState>(createDefaultDiaryState);
  const [isLoading, setIsLoading] = useState(true);

  const proMember = isProMember(user);
  const titanNutritionAccess = hasTitanNutritionAccess(user);

  const loadDiaryForAthlete = useCallback(async (id: string) => {
    if (apiNutritionMode) {
      let remote = await getDiary(id);
      const isEmpty =
        remote.foodLog.length === 0 && Object.keys(remote.waterByDate).length === 0;
      if (isEmpty && hasLocalDiaryData(id)) {
        const local = migrateLegacyDiaryIfNeeded(id);
        remote = await putDiary(id, local);
        clearLocalDiary(id);
      }
      return remote;
    }
    return migrateLegacyDiaryIfNeeded(id);
  }, [apiNutritionMode]);

  useEffect(() => {
    if (!athleteId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [plan, diaryState] = await Promise.all([
        getMealPlan(athleteId),
        loadDiaryForAthlete(athleteId),
      ]);
      if (!cancelled) {
        setAssigned(plan);
        setDiary(diaryState);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId, loadDiaryForAthlete]);

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

  const persistDiaryChange = useCallback(
    async (
      updater: (prev: AthleteDiaryState) => AthleteDiaryState,
      apiAction?: () => Promise<AthleteDiaryState>,
    ) => {
      if (!athleteId) return;
      const previous = diary;
      const optimistic = updater(previous);
      setDiary(optimistic);

      if (apiNutritionMode && apiAction) {
        try {
          const saved = await apiAction();
          setDiary(saved);
        } catch {
          setDiary(previous);
          toast.error('No se pudo guardar el cambio en el diario');
        }
        return;
      }

      if (!apiNutritionMode) {
        const { saveDiaryState } = await import('@/lib/nutrition/diary-storage');
        saveDiaryState(athleteId, optimistic);
      }
    },
    [athleteId, apiNutritionMode, diary],
  );

  const logFoodItem = useCallback(
    (item: Omit<MealItem, 'id'>, date?: string) => {
      const dateKey = date ?? toLocalDateKey();
      void persistDiaryChange(
        (prev) => {
          const newItem: MealItem = {
            ...item,
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          };
          const idx = prev.foodLog.findIndex((e) => e.date === dateKey);
          const foodLog = [...prev.foodLog];
          if (idx >= 0) {
            foodLog[idx] = { ...foodLog[idx], items: [...foodLog[idx].items, newItem] };
          } else {
            foodLog.push({ date: dateKey, items: [newItem] });
          }
          return { ...prev, foodLog };
        },
        apiNutritionMode
          ? () => addDiaryEntry(athleteId!, dateKey, item)
          : undefined,
      );
    },
    [persistDiaryChange, apiNutritionMode, athleteId],
  );

  const removeFoodItem = useCallback(
    (itemId: string, date?: string) => {
      const dateKey = date ?? toLocalDateKey();
      void persistDiaryChange(
        (prev) => ({
          ...prev,
          foodLog: prev.foodLog
            .map((e) =>
              e.date === dateKey ? { ...e, items: e.items.filter((i) => i.id !== itemId) } : e,
            )
            .filter((e) => e.items.length > 0),
        }),
        apiNutritionMode
          ? () => deleteDiaryEntry(athleteId!, itemId, dateKey)
          : undefined,
      );
    },
    [persistDiaryChange, apiNutritionMode, athleteId],
  );

  const addWater = useCallback(
    (ml: number, date?: string) => {
      const dateKey = date ?? toLocalDateKey();
      void persistDiaryChange(
        (prev) => ({
          ...prev,
          waterByDate: {
            ...prev.waterByDate,
            [dateKey]: Math.max(0, (prev.waterByDate[dateKey] ?? 0) + ml),
          },
        }),
        apiNutritionMode
          ? () => patchDiaryWater(athleteId!, { date: dateKey, mlDelta: ml })
          : undefined,
      );
    },
    [persistDiaryChange, apiNutritionMode, athleteId],
  );

  const setWaterGoalMl = useCallback(
    (ml: number) => {
      const dateKey = toLocalDateKey();
      void persistDiaryChange(
        (prev) => ({ ...prev, waterGoalMl: ml }),
        apiNutritionMode
          ? () => patchDiaryWater(athleteId!, { date: dateKey, goalMl: ml })
          : undefined,
      );
    },
    [persistDiaryChange, apiNutritionMode, athleteId],
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
