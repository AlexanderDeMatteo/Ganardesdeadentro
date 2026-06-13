'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCoach } from '@/app/context/coach-context';
import { useNutrition } from '@/hooks/use-nutrition';
import { addDaysToDateKey, getLast7DateKeys, toLocalDateKey } from '@/lib/nutrition/dates';
import { sumMealItemMacros } from '@/lib/nutrition/macros';
import type { MealItem } from '@/lib/nutrition/types';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { type RefObject, useMemo, useState } from 'react';

type FoodDiaryProps = {
  date?: string;
  onDateChange?: (date: string) => void;
  formRef?: RefObject<HTMLInputElement | null>;
};

function parseOptionalMacro(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function formatItemMacros(item: MealItem): string {
  const parts: string[] = [];
  if (item.calories != null) parts.push(`${item.calories} kcal`);
  const macros: string[] = [];
  if (item.proteinG != null) macros.push(`P${item.proteinG}g`);
  if (item.carbsG != null) macros.push(`C${item.carbsG}g`);
  if (item.fatG != null) macros.push(`G${item.fatG}g`);
  if (macros.length > 0) parts.push(macros.join(' '));
  return parts.join(' · ');
}

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
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    logFoodItem(
      {
        name: trimmed,
        calories: parseOptionalMacro(calories),
        proteinG: parseOptionalMacro(proteinG),
        carbsG: parseOptionalMacro(carbsG),
        fatG: parseOptionalMacro(fatG),
      },
      dateKey,
    );
    setName('');
    setCalories('');
    setProteinG('');
    setCarbsG('');
    setFatG('');
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
        {(totals.proteinG > 0 || totals.carbsG > 0 || totals.fatG > 0) && (
          <span className="text-muted-foreground">
            {' '}
            · P {totals.proteinG}g · C {totals.carbsG}g · G {totals.fatG}g
          </span>
        )}
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
        <div className="w-24 space-y-1">
          <Label htmlFor="diary-kcal">kcal</Label>
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
        <div className="w-20 space-y-1">
          <Label htmlFor="diary-protein">P (g)</Label>
          <Input
            id="diary-protein"
            type="number"
            min={0}
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
            placeholder="12"
            className="text-base md:text-base"
          />
        </div>
        <div className="w-20 space-y-1">
          <Label htmlFor="diary-carbs">C (g)</Label>
          <Input
            id="diary-carbs"
            type="number"
            min={0}
            value={carbsG}
            onChange={(e) => setCarbsG(e.target.value)}
            placeholder="40"
            className="text-base md:text-base"
          />
        </div>
        <div className="w-20 space-y-1">
          <Label htmlFor="diary-fat">G (g)</Label>
          <Input
            id="diary-fat"
            type="number"
            min={0}
            value={fatG}
            onChange={(e) => setFatG(e.target.value)}
            placeholder="8"
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
                {formatItemMacros(item) && (
                  <span className="ml-2 text-muted-foreground">{formatItemMacros(item)}</span>
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
