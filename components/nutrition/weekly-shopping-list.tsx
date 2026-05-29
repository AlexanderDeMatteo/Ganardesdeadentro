'use client';

import { Button } from '@/components/ui/button';
import { buildWeeklyShoppingList, formatShoppingSlotLabels } from '@/lib/nutrition/shopping-list';
import { createDefaultSlotTimes } from '@/lib/nutrition/meal-schedule';
import type { MealPlan, MealSlotTimes } from '@/lib/nutrition/types';
import { toast } from 'sonner';

export function WeeklyShoppingList({
  mealPlan,
  slotTimes,
}: {
  mealPlan: MealPlan | null;
  slotTimes?: MealSlotTimes;
}) {
  if (!mealPlan) return null;

  const times = slotTimes ?? createDefaultSlotTimes();
  const items = buildWeeklyShoppingList(mealPlan, times);

  if (items.length === 0) return null;

  const copyList = async () => {
    const text = items
      .map((e) => {
        const grams = e.gramsPending
          ? `${e.name} (cantidad pendiente)`
          : e.totalG != null
            ? `${e.name}: ${e.totalG} g`
            : e.name;
        const schedule = e.times.length ? ` · ${e.times.join(', ')}` : '';
        return `• ${grams}${schedule}`;
      })
      .join('\n');
    await navigator.clipboard.writeText(text);
    toast.success('Lista copiada al portapapeles.');
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase">Lista de compra (semana)</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => void copyList()}>
          Copiar lista
        </Button>
      </div>
      <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
        {items.map((entry) => (
          <li
            key={entry.name}
            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-2 last:border-0"
          >
            <span className="font-medium text-foreground">{entry.name}</span>
            <span className="text-muted-foreground">
              {entry.gramsPending && entry.totalG == null ? (
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                  Pendiente de cantidad
                </span>
              ) : (
                <span>{entry.totalG ?? 0} g total</span>
              )}
            </span>
            <span className="w-full text-xs text-muted-foreground">
              {entry.times.length > 0 && <>Horarios: {entry.times.join(', ')} · </>}
              {formatShoppingSlotLabels(entry.slots)}
              {entry.occurrences > 1 && ` · ×${entry.occurrences} en la semana`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
