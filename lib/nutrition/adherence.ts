import { formatDateKeyShort, getLast7DateKeys } from './dates';
import { sumMealItemMacros } from './macros';
import type { FoodLogEntry, WeeklyAdherenceDay } from './types';

export function formatAdherenceDeviation(calories: number, target: number): number | null {
  if (target <= 0 || calories <= 0) return null;
  return Math.round(((calories - target) / target) * 100);
}

export function getWeeklyAdherence(
  foodLog: FoodLogEntry[],
  targetCalories: number | null,
): { days: WeeklyAdherenceDay[]; adherencePercent: number } {
  const target = targetCalories ?? 0;
  const keys = getLast7DateKeys();
  const logByDate = new Map(foodLog.map((e) => [e.date, e.items]));

  const days: WeeklyAdherenceDay[] = keys.map((date) => {
    const items = logByDate.get(date) ?? [];
    const totals = sumMealItemMacros(items);
    const calories = totals.calories;
    const withinTarget =
      target > 0 && calories > 0 ? Math.abs(calories - target) / target <= 0.1 : false;
    return {
      date,
      label: formatDateKeyShort(date),
      withinTarget,
      calories,
      target,
    };
  });

  const logged = days.filter((d) => d.calories > 0);
  const onTarget = logged.filter((d) => d.withinTarget).length;
  const adherencePercent = logged.length > 0 ? Math.round((onTarget / logged.length) * 100) : 0;

  return { days, adherencePercent };
}
