'use client';

import { useCallback, useEffect, useState } from 'react';
import { getDiary } from '@/lib/data/client';
import { addDaysToDateKey, toLocalDateKey } from '@/lib/nutrition/dates';
import { sumMealItemMacros } from '@/lib/nutrition/macros';
import type { AthleteDiaryState } from '@/lib/nutrition/types';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react';

export function CoachDiaryView({ athleteId }: { athleteId: string }) {
  const [dateKey, setDateKey] = useState(() => toLocalDateKey());
  const [diary, setDiary] = useState<AthleteDiaryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDiary(athleteId, dateKey);
      setDiary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el diario');
      setDiary(null);
    } finally {
      setIsLoading(false);
    }
  }, [athleteId, dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const entry = diary?.foodLog.find((e) => e.date === dateKey);
  const items = entry?.items ?? [];
  const totals = sumMealItemMacros(items);
  const waterMl = diary?.waterByDate[dateKey] ?? 0;
  const waterGoal = diary?.waterGoalMl ?? 2000;
  const displayDate = new Date(`${dateKey}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (isLoading) {
    return <LoadingState label="Cargando diario del atleta…" />;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Vista de solo lectura del diario nutricional del atleta.
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setDateKey((d) => addDaysToDateKey(d, -1))}
          aria-label="Día anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-medium text-foreground">{displayDate}</p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setDateKey((d) => addDaysToDateKey(d, 1))}
          disabled={dateKey >= toLocalDateKey()}
          aria-label="Día siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="brand-card space-y-4 rounded-2xl border border-border p-6">
        <h3 className="text-lg font-bold">Comidas registradas</h3>
        <p className="text-sm font-semibold">Total: {totals.calories} kcal</p>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin registros en este día.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {items.map((item) => (
              <li key={item.id} className="px-3 py-2 text-sm">
                {item.name}
                {item.calories != null && (
                  <span className="ml-2 text-muted-foreground">{item.calories} kcal</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="brand-card space-y-3 rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2">
          <Droplets className="size-5 text-cyan-400" aria-hidden />
          <h3 className="text-lg font-bold">Hidratación</h3>
        </div>
        <p className="text-2xl font-black">
          {(waterMl / 1000).toFixed(1)} L
          <span className="text-base text-muted-foreground"> / {(waterGoal / 1000).toFixed(1)} L</span>
        </p>
      </div>
    </div>
  );
}
