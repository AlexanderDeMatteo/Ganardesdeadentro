'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  buildWeightArray,
  type StandardExerciseDraft,
} from '@/lib/routines/exercise-block-config';
import type { RoutineFormStyles } from '@/components/admin/routine-forms/routine-form-styles';

type StandardExerciseFormProps = RoutineFormStyles & {
  draft: StandardExerciseDraft;
  onChange: (draft: StandardExerciseDraft) => void;
};

export function StandardExerciseForm({
  draft,
  onChange,
  prime,
  labelClass,
  inputClass,
  progressionPanelClass,
  weightInputClass,
}: StandardExerciseFormProps) {
  const weightPreview = draft.setWeights.map((w, i) => `S${i + 1}: ${w || '—'} kg`).join(' · ');
  const weightInput = weightInputClass ?? inputClass;

  const syncSetWeights = (count: number, weights?: string[]) => {
    if (weights && weights.length === count) {
      onChange({ ...draft, setWeights: weights });
      return;
    }
    const base = parseFloat(draft.baseWeight.replace(',', '.')) || 20;
    const step = parseFloat(draft.weightStep.replace(',', '.')) || 2.5;
    onChange({ ...draft, setWeights: buildWeightArray(count, base, step).map(String) });
  };

  const handleSetsChange = (value: number) => {
    const next = Math.max(1, Math.min(10, value));
    const base = parseFloat(draft.baseWeight.replace(',', '.')) || 20;
    const step = parseFloat(draft.weightStep.replace(',', '.')) || 2.5;
    const weights =
      draft.setWeights.length === next ? draft.setWeights
      : buildWeightArray(next, base, step).map(String);
    onChange({ ...draft, sets: next, setWeights: weights });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Series</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={draft.sets}
            onChange={(e) => handleSetsChange(parseInt(e.target.value, 10) || 1)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Repeticiones</label>
          <Input
            type="number"
            min={1}
            max={50}
            value={draft.reps}
            onChange={(e) => onChange({ ...draft, reps: parseInt(e.target.value, 10) || 1 })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Descanso (seg)</label>
          <Input
            type="number"
            min={30}
            max={300}
            step={30}
            value={draft.rest}
            onChange={(e) => onChange({ ...draft, rest: parseInt(e.target.value, 10) || 30 })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Técnica (opcional)</label>
          <Input
            placeholder="Puntos clave de ejecución"
            value={draft.technique}
            onChange={(e) => onChange({ ...draft, technique: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className={cn('space-y-3 rounded-lg p-4', progressionPanelClass)}>
        <p className={cn('text-xs', prime ? 'gp-label gp-text-phosphor' : 'font-medium')}>
          Progresión de peso
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className={labelClass}>Peso base (kg)</label>
            <Input
              value={draft.baseWeight}
              onChange={(e) => onChange({ ...draft, baseWeight: e.target.value })}
              className={weightInput}
              inputMode="decimal"
            />
          </div>
          <div>
            <label className={labelClass}>Progresión (+kg/serie)</label>
            <Input
              value={draft.weightStep}
              onChange={(e) => onChange({ ...draft, weightStep: e.target.value })}
              className={weightInput}
              inputMode="decimal"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => syncSetWeights(draft.sets)}
            className={prime ? 'gp-btn-ghost gp-mono h-9 px-3 text-xs uppercase' : undefined}
          >
            Aplicar progresión
          </Button>
        </div>
        <p className={cn('text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
          Peso sugerido por serie
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {draft.setWeights.map((w, i) => (
            <div key={i}>
              <label className={cn('text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
                Serie {i + 1}
              </label>
              <Input
                value={w}
                onChange={(e) => {
                  const next = [...draft.setWeights];
                  next[i] = e.target.value;
                  onChange({ ...draft, setWeights: next });
                }}
                className={cn(weightInput, 'mt-1')}
                inputMode="decimal"
              />
            </div>
          ))}
        </div>
        <p className={cn('text-xs', prime ? 'gp-mono gp-text-phosphor' : 'text-cyan-600 dark:text-cyan-400')}>
          {weightPreview}
        </p>
      </div>
    </>
  );
}
