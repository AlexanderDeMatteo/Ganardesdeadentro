'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNutrition } from '@/hooks/use-nutrition';
import { toLocalDateKey } from '@/lib/nutrition/dates';
import { Droplets } from 'lucide-react';

export function WaterTracker() {
  const { diary, addWater, setWaterGoalMl } = useNutrition();
  const today = toLocalDateKey();
  const consumed = diary.waterByDate[today] ?? 0;
  const goal = diary.waterGoalMl;
  const pct = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;

  return (
    <div className="brand-card space-y-4 rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Droplets className="size-5 text-cyan-400" aria-hidden />
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Hidratación</h2>
      </div>
      <p className="text-3xl font-black text-foreground">
        {(consumed / 1000).toFixed(1)} L
        <span className="text-lg text-muted-foreground"> / {(goal / 1000).toFixed(1)} L</span>
      </p>
      <Progress value={pct} className="h-3" aria-label={`Agua: ${pct}% de la meta`} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => addWater(250)}>
          +250 ml
        </Button>
        <Button type="button" variant="outline" onClick={() => addWater(500)}>
          +500 ml
        </Button>
        <Button type="button" variant="ghost" onClick={() => addWater(-consumed)} disabled={consumed <= 0}>
          Reiniciar hoy
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Meta diaria: {goal} ml ·{' '}
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => setWaterGoalMl(3000)}
        >
          3 L
        </button>
        {' · '}
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => setWaterGoalMl(2500)}
        >
          2.5 L
        </button>
      </p>
    </div>
  );
}
