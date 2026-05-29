'use client';

import { useCoachNutritionContext } from '@/app/context/coach-nutrition-context';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from '@/lib/nutrition/metabolism';
import type { ActivityLevel, MetabolismInput, MetabolismResult, NutritionGoal } from '@/lib/nutrition/types';
const GOAL_OPTIONS: { goal: NutritionGoal; adjustment: number; label: string }[] = [
  { goal: 'lose', adjustment: -500, label: 'Déficit −500 kcal' },
  { goal: 'lose', adjustment: -300, label: 'Déficit −300 kcal' },
  { goal: 'maintain', adjustment: 0, label: 'Mantenimiento' },
  { goal: 'gain', adjustment: 300, label: 'Superávit +300 kcal' },
];

export function MetabolismPanel({
  input,
  metabolism,
}: {
  input: MetabolismInput | null;
  metabolism: MetabolismResult | null;
  readOnly?: boolean;
}) {
  const { state, saveSettings, canEdit } = useCoachNutritionContext();

  const profileLine = input
    ? `${input.weightKg} kg · ${input.heightCm} cm · ${input.age} años · ${input.sex === 'male' ? 'Hombre' : 'Mujer'}`
    : null;

  return (
    <div className="brand-card space-y-6 rounded-2xl p-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Metabolismo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasa metabólica basal (Mifflin-St Jeor) y gasto energético total estimado.
        </p>
      </div>

      {profileLine ? (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">{profileLine}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Datos corporales incompletos del atleta. Completa peso, altura, edad y sexo en el perfil.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="activity-level">Nivel de actividad</Label>
            <Select
              value={state.activityLevel}
              onValueChange={(v) => saveSettings({ activityLevel: v as ActivityLevel })}
              disabled={!canEdit}
            >
              <SelectTrigger id="activity-level" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ACTIVITY_FACTORS) as [ActivityLevel, { label: string }][]).map(
                  ([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nutrition-goal">Objetivo calórico</Label>
            <Select
              value={`${state.goal}:${state.calorieAdjustment}`}
              onValueChange={(v) => {
                const [goal, adj] = v.split(':') as [NutritionGoal, string];
                saveSettings({ goal, calorieAdjustment: Number(adj) });
              }}
              disabled={!canEdit}
            >
              <SelectTrigger id="nutrition-goal" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((o) => (
                  <SelectItem key={`${o.goal}:${o.adjustment}`} value={`${o.goal}:${o.adjustment}`}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>

      {metabolism && (
        <dl className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/20 p-4 text-center">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">TMB</dt>
            <dd className="text-2xl font-black">{metabolism.bmr}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">TDEE</dt>
            <dd className="text-2xl font-black">{metabolism.tdee}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Objetivo</dt>
            <dd className="text-2xl font-black text-primary">{metabolism.targetCalories}</dd>
          </div>
        </dl>
      )}

      <p className="text-xs text-muted-foreground">
        Objetivo base: {GOAL_ADJUSTMENTS[state.goal].label} ({state.calorieAdjustment >= 0 ? '+' : ''}
        {state.calorieAdjustment} kcal sobre TDEE).
      </p>
    </div>
  );
}
