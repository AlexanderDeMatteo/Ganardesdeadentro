'use client';

import { MEAL_SLOT_LABELS, type DayPlan, type MealSlot, type MealSlotTimes } from '@/lib/nutrition/types';
import { getMealSlotItems } from '@/lib/nutrition/normalize-meal-plan';

export function PlanDayMeals({
  dayPlan,
  slotTimes,
  mode,
  onRemove,
}: {
  dayPlan: DayPlan;
  slotTimes: MealSlotTimes;
  mode: 'edit' | 'view';
  onRemove?: (day: number, slot: MealSlot, itemId: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(Object.keys(MEAL_SLOT_LABELS) as MealSlot[]).map((slot) => {
        const slotItems = getMealSlotItems(dayPlan.meals, slot);
        return (
        <div key={slot} className="rounded-lg border border-border/80 p-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-primary">
              {MEAL_SLOT_LABELS[slot]}
            </h4>
            <span className="text-xs text-muted-foreground">{slotTimes[slot]}</span>
          </div>
          {slotItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin ítems</p>
          ) : (
            <ul className="space-y-2">
              {slotItems.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{item.name}</span>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                      {item.quantityG != null && <span>{item.quantityG} g</span>}
                      {item.scheduledTime && <span>{item.scheduledTime}</span>}
                      {item.calories != null && <span>{item.calories} kcal</span>}
                    </div>
                  </div>
                  {mode === 'edit' && onRemove && (
                    <button
                      type="button"
                      className="shrink-0 text-xs text-destructive hover:underline"
                      onClick={() => onRemove(dayPlan.day, slot, item.id)}
                    >
                      Quitar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        );
      })}
    </div>
  );
}
