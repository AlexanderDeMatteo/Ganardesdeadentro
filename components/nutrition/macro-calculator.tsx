'use client';

import { useCoachNutritionContext } from '@/app/context/coach-nutrition-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  clampCalories,
  isValidMacroSplit,
  MACRO_PRESETS,
  macrosFromCalories,
  type MacroPresetId,
} from '@/lib/nutrition/macros';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function MacroCalculator({ defaultCalories }: { defaultCalories: number }) {
  const { setMacroTargets, state, canEdit, publish } = useCoachNutritionContext();
  const [calories, setCalories] = useState(defaultCalories);
  const [presetId, setPresetId] = useState<MacroPresetId>('balanced');
  const [customSplit, setCustomSplit] = useState({ protein: 30, carbs: 40, fat: 30 });

  useEffect(() => {
    setCalories(defaultCalories);
  }, [defaultCalories]);

  const preset = MACRO_PRESETS.find((p) => p.id === presetId) ?? MACRO_PRESETS[0];
  const split = presetId === 'custom' ? customSplit : preset.split;
  const valid = isValidMacroSplit(split);
  const preview = valid ? macrosFromCalories(calories, split, preset.label) : null;

  const handleApply = () => {
    if (!canEdit) return;
    if (!preview || !valid) {
      toast.error('Revisa los porcentajes: deben sumar 100% y estar entre 5% y 70%.');
      return;
    }
    setMacroTargets(preview);
    toast.success('Objetivo de macros guardado en el borrador.');
  };

  const handleSaveForAthlete = () => {
    if (!canEdit) return;
    if (!preview || !valid) {
      toast.error('Revisa los porcentajes: deben sumar 100% y estar entre 5% y 70%.');
      return;
    }

    // Keep draft and preview in sync before publishing.
    setMacroTargets(preview);

    const hasActivePlan =
      state.mealPlans.find((p) => p.id === state.activeMealPlanId) != null || state.mealPlans[0] != null;

    if (!hasActivePlan) {
      toast.error('Macros guardados en borrador. Crea o selecciona un plan para publicarlo al atleta.');
      return;
    }

    publish({ macroTargets: preview });
  };

  return (
    <div className="brand-card space-y-6 rounded-2xl p-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Calculadora de macros</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Distribuye proteínas, carbohidratos y grasas según las kcal objetivo del atleta.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-kcal">Calorías objetivo (kcal/día)</Label>
        <Input
          id="target-kcal"
          type="number"
          min={1200}
          max={6000}
          value={calories}
          onChange={(e) => setCalories(clampCalories(Number(e.target.value) || 0))}
          disabled={!canEdit}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {MACRO_PRESETS.map((p) => (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={presetId === p.id ? 'default' : 'outline'}
            onClick={() => setPresetId(p.id)}
            disabled={!canEdit}
          >
            {p.label.split(' (')[0]}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={presetId === 'custom' ? 'default' : 'outline'}
          onClick={() => setPresetId('custom')}
          disabled={!canEdit}
        >
          Personalizado
        </Button>
      </div>

      {presetId === 'custom' && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          {(['protein', 'carbs', 'fat'] as const).map((key) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>
                  {key === 'protein' ? 'Proteína' : key === 'carbs' ? 'Carbos' : 'Grasas'} (%)
                </Label>
                <span aria-live="polite">{customSplit[key]}%</span>
              </div>
              <Slider
                value={[customSplit[key]]}
                min={5}
                max={70}
                step={1}
                onValueChange={([v]) => setCustomSplit((s) => ({ ...s, [key]: v }))}
                disabled={!canEdit}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Suma actual: {customSplit.protein + customSplit.carbs + customSplit.fat}% (debe ser 100%)
          </p>
        </div>
      )}

      {preview && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <dt className="text-xs text-muted-foreground">kcal</dt>
            <dd className="text-xl font-black">{preview.calories}</dd>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <dt className="text-xs text-muted-foreground">Proteína</dt>
            <dd className="text-xl font-black">{preview.proteinG} g</dd>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <dt className="text-xs text-muted-foreground">Carbos</dt>
            <dd className="text-xl font-black">{preview.carbsG} g</dd>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <dt className="text-xs text-muted-foreground">Grasas</dt>
            <dd className="text-xl font-black">{preview.fatG} g</dd>
          </div>
        </dl>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleApply} disabled={!valid || !canEdit}>
          Guardar objetivo en borrador
        </Button>
        <Button type="button" variant="secondary" onClick={handleSaveForAthlete} disabled={!valid || !canEdit}>
          Guardar macros para el atleta
        </Button>
      </div>

      {state.macroTargets && (
        <p className="text-xs text-muted-foreground">
          Borrador activo: {state.macroTargets.calories} kcal · P {state.macroTargets.proteinG}g · C{' '}
          {state.macroTargets.carbsG}g · G {state.macroTargets.fatG}g
        </p>
      )}
    </div>
  );
}
