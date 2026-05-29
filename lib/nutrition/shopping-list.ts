import type { MealPlan, MealSlot, MealSlotTimes, ShoppingListEntry } from './types';
import { MEAL_SLOT_LABELS } from './types';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function buildWeeklyShoppingList(
  plan: MealPlan,
  slotTimes: MealSlotTimes,
): ShoppingListEntry[] {
  const map = new Map<
    string,
    { displayName: string; totalG: number; hasMissingG: boolean; occurrences: number; slots: Set<MealSlot>; times: Set<string> }
  >();

  for (const day of plan.days) {
    for (const slot of Object.keys(day.meals) as MealSlot[]) {
      const time = slotTimes[slot] ?? '';
      for (const item of day.meals[slot]) {
        const trimmed = item.name.trim();
        if (!trimmed) continue;
        const key = normalizeName(trimmed);
        const existing = map.get(key);
        const itemTime = item.scheduledTime ?? time;
        if (existing) {
          existing.occurrences += 1;
          existing.slots.add(slot);
          if (itemTime) existing.times.add(itemTime);
          if (item.quantityG != null && Number.isFinite(item.quantityG)) {
            existing.totalG += item.quantityG;
          } else {
            existing.hasMissingG = true;
          }
        } else {
          const hasG = item.quantityG != null && Number.isFinite(item.quantityG);
          map.set(key, {
            displayName: trimmed,
            totalG: hasG ? item.quantityG! : 0,
            hasMissingG: !hasG,
            occurrences: 1,
            slots: new Set([slot]),
            times: new Set(itemTime ? [itemTime] : []),
          });
        }
      }
    }
  }

  return Array.from(map.values())
    .map((e) => ({
      name: e.displayName,
      totalG: e.totalG > 0 ? Math.round(e.totalG) : e.hasMissingG ? null : 0,
      gramsPending: e.hasMissingG,
      occurrences: e.occurrences,
      slots: Array.from(e.slots),
      times: Array.from(e.times).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function formatShoppingSlotLabels(slots: MealSlot[]): string {
  return slots.map((s) => MEAL_SLOT_LABELS[s]).join(', ');
}
