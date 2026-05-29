import { NUTRITION_STORAGE_KEY, parseNutritionState } from './storage';
import type { AthleteDiaryState } from './types';

export function diaryStorageKey(athleteId: string): string {
  return `fittrack_nutrition_diary_${athleteId}`;
}

export function createDefaultDiaryState(): AthleteDiaryState {
  return {
    foodLog: [],
    waterByDate: {},
    waterGoalMl: 2500,
    updatedAt: new Date().toISOString(),
  };
}

export function parseDiaryState(raw: string | null): AthleteDiaryState {
  if (!raw) return createDefaultDiaryState();
  try {
    const o = JSON.parse(raw) as Partial<AthleteDiaryState>;
    const defaults = createDefaultDiaryState();
    return {
      ...defaults,
      ...o,
      foodLog: Array.isArray(o.foodLog) ? o.foodLog : defaults.foodLog,
      waterByDate:
        o.waterByDate && typeof o.waterByDate === 'object' ? o.waterByDate : defaults.waterByDate,
    };
  } catch {
    return createDefaultDiaryState();
  }
}

export function loadDiaryState(athleteId: string): AthleteDiaryState {
  if (typeof window === 'undefined') return createDefaultDiaryState();
  return parseDiaryState(localStorage.getItem(diaryStorageKey(athleteId)));
}

export function saveDiaryState(athleteId: string, state: AthleteDiaryState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      diaryStorageKey(athleteId),
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota */
  }
}

/** One-time migration from legacy single-key nutrition state */
export function migrateLegacyDiaryIfNeeded(athleteId: string): AthleteDiaryState {
  const existing = loadDiaryState(athleteId);
  if (existing.foodLog.length > 0) return existing;

  if (typeof window === 'undefined') return existing;

  try {
    const legacyRaw = localStorage.getItem(NUTRITION_STORAGE_KEY);
    if (!legacyRaw) return existing;

    const legacy = parseNutritionState(legacyRaw);
    if (legacy.foodLog.length === 0 && Object.keys(legacy.waterByDate).length === 0) {
      return existing;
    }

    const migrated: AthleteDiaryState = {
      foodLog: legacy.foodLog,
      waterByDate: legacy.waterByDate,
      waterGoalMl: legacy.waterGoalMl,
      updatedAt: new Date().toISOString(),
    };
    saveDiaryState(athleteId, migrated);
    return migrated;
  } catch {
    return existing;
  }
}
