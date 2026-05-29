'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCoach } from '@/app/context/coach-context';
import { useNutrition } from '@/hooks/use-nutrition';
import { addDaysToDateKey, getLast7DateKeys, toLocalDateKey } from '@/lib/nutrition/dates';
import { sumMealItemMacros } from '@/lib/nutrition/macros';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { type RefObject, useMemo, useState } from 'react';

type FoodDiaryProps = {
  date?: string;
  onDateChange?: (date: string) => void;
  formRef?: RefObject<HTMLInputElement | null>;
};

export function FoodDiary({ date, onDateChange, formRef }: FoodDiaryProps) {
  const { diary, logFoodItem, removeFoodItem, macroTargets, hasTitanNutritionAccess } = useNutrition();
  const { requestNutritionQuickEstimate } = useCoach();
  const dateKey = date ?? toLocalDateKey();
  const isToday = dateKey === toLocalDateKey();
  const entry = diary.foodLog.find((e) => e.date === dateKey);
  const items = entry?.items ?? [];
  const totals = sumMealItemMacros(items);
  const weekKeys = useMemo(() => getLast7DateKeys(), []);
  const canGoPrev = weekKeys[0] != null && dateKey > weekKeys[0];
  const canGoNext = weekKeys[weekKeys.length - 1] != null && dateKey < weekKeys[weekKeys.length - 1];

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const kcal = calories ? Number(calories) : undefined;
    logFoodItem({
      name: trimmed,
      calories: kcal && Number.isFinite(kcal) ? kcal : undefined,
    }, dateKey);
    setName('');
    setCalories('');
  };

  const displayDate = new Date(`${dateKey}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="brand-card space-y-4 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
            {isToday ? 'Diario del día' : `Diario del ${displayDate}`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Registra lo que comes ({displayDate}).</p>
        </div>
        {!isToday && (
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            onClick={() => onDateChange?.(toLocalDateKey())}
          >
            Volver a hoy
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-[44px] min-w-[44px] p-3"
          disabled={!canGoPrev}
          onClick={() => onDateChange?.(addDaysToDateKey(dateKey, -1))}
          aria-label="Ir al día anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-medium text-muted-foreground">{displayDate}</p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-[44px] min-w-[44px] p-3"
          disabled={!canGoNext}
          onClick={() => onDateChange?.(addDaysToDateKey(dateKey, 1))}
          aria-label="Ir al día siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="text-sm font-semibold text-foreground">
        Total: {totals.calories} kcal
        {macroTargets && (
          <span className="text-muted-foreground">
            {' '}
            / objetivo {macroTargets.calories} kcal
          </span>
        )}
      </p>

      {hasTitanNutritionAccess ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">
            Titan te guiará desde el panel flotante. Usa estimación rápida para iniciar la conversación.
          </p>
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={requestNutritionQuickEstimate}>
            Estimar rápido
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tu plan actual usa registro manual. Titan Nutricional está disponible en Premium o Pro.
        </p>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1 space-y-1">
          <Label htmlFor="diary-name">Alimento</Label>
          <Input
            id="diary-name"
            ref={formRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ensalada César"
            className="text-base md:text-base"
          />
        </div>
        <div className="w-28 space-y-1">
          <Label htmlFor="diary-kcal">kcal estimadas</Label>
          <Input
            id="diary-kcal"
            type="number"
            min={0}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="350"
            className="text-base md:text-base"
          />
        </div>
        <Button type="submit" className="min-h-[44px]">
          Registrar
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isToday ? 'Aún no hay registros hoy.' : 'Aún no hay registros en este día.'}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>
                {item.name}
                {item.calories != null && (
                  <span className="ml-2 text-muted-foreground">{item.calories} kcal</span>
                )}
              </span>
              <button
                type="button"
                className="min-h-[44px] min-w-[44px] p-3 text-destructive hover:text-destructive/80"
                onClick={() => removeFoodItem(item.id, dateKey)}
                aria-label={`Eliminar ${item.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
