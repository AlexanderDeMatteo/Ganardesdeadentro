'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  SUPERSET_MAX_TRANSITION_SEC,
  createDefaultSupersetDraft,
  type SupersetExerciseDraft,
} from '@/lib/routines/exercise-block-config';
import type { SupersetSubtype } from '@/lib/data/types';
import type { RoutineFormStyles } from '@/components/admin/routine-forms/routine-form-styles';
import { Plus, Trash2 } from 'lucide-react';

type SupersetExerciseFormProps = RoutineFormStyles & {
  draft: SupersetExerciseDraft;
  subtype: SupersetSubtype;
  onChange: (draft: SupersetExerciseDraft) => void;
};

export function SupersetExerciseForm({
  draft,
  subtype,
  onChange,
  prime,
  labelClass,
  inputClass,
}: SupersetExerciseFormProps) {
  const updateStep = (index: number, patch: Partial<SupersetExerciseDraft['steps'][number]>) => {
    const steps = draft.steps.map((step, i) => (i === index ? { ...step, ...patch } : step));
    onChange({ ...draft, steps });
  };

  const addStep = () => {
    onChange({
      ...draft,
      steps: [...draft.steps, { weightKg: '10', repsTarget: '10' }],
    });
  };

  const removeStep = (index: number) => {
    if (draft.steps.length <= 2) return;
    onChange({ ...draft, steps: draft.steps.filter((_, i) => i !== index) });
  };

  const applyTemplate = () => {
    onChange(createDefaultSupersetDraft(subtype));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn('text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
          {subtype === 'progressive' ?
            'Asciende peso y baja reps; cierra con remate metabólico.'
          : 'Drop sets: baja peso por escalones hasta fallo.'}{' '}
          Máx. {SUPERSET_MAX_TRANSITION_SEC}s entre escalones · 1 serie total.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={applyTemplate}
          className={prime ? 'gp-btn-ghost gp-mono text-xs uppercase' : undefined}
        >
          Plantilla ejemplo
        </Button>
      </div>

      <div className="space-y-2">
        <p className={cn('text-xs font-medium', prime ? 'gp-label gp-text-phosphor' : '')}>
          Escalones
        </p>
        {draft.steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'grid grid-cols-1 items-end gap-2 rounded-lg border p-2 sm:grid-cols-[auto_1fr_1fr_auto]',
              prime ? 'gp-border-outline gp-bg-surface-high/40' : 'border-border',
            )}
          >
            <span className={cn('pb-2 text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
              {index + 1}
            </span>
            <div>
              <label className={labelClass}>Peso (kg)</label>
              <Input
                value={step.weightKg}
                onChange={(e) => updateStep(index, { weightKg: e.target.value })}
                className={inputClass}
                inputMode="decimal"
              />
            </div>
            <div>
              <label className={labelClass}>Reps objetivo</label>
              <Input
                value={step.repsTarget}
                onChange={(e) => updateStep(index, { repsTarget: e.target.value })}
                className={inputClass}
                placeholder="Ej: 8 o al fallo"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={draft.steps.length <= 2}
              onClick={() => removeStep(index)}
              className="h-9 w-9 shrink-0 p-0"
              aria-label={`Quitar escalón ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStep}
          className={prime ? 'gp-btn-ghost gp-mono text-xs uppercase' : undefined}
        >
          <Plus className="mr-1 h-4 w-4" />
          Añadir escalón
        </Button>
      </div>

      {subtype === 'progressive' ? (
        <div
          className={cn(
            'space-y-3 rounded-lg border p-3',
            prime ? 'gp-border-outline gp-bg-surface-high/40' : 'border-border bg-background/50',
          )}
        >
          <p className={cn('text-sm font-medium', prime ? 'gp-mono gp-text-primary' : '')}>
            Remate final (obligatorio)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Peso (kg)</label>
              <Input
                value={draft.finisherWeightKg}
                onChange={(e) => onChange({ ...draft, finisherWeightKg: e.target.value })}
                className={inputClass}
                inputMode="decimal"
              />
            </div>
            <div>
              <label className={labelClass}>Reps objetivo</label>
              <Input
                value={draft.finisherRepsTarget}
                onChange={(e) => onChange({ ...draft, finisherRepsTarget: e.target.value })}
                className={inputClass}
                placeholder="Ej: 20"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Descanso entre series completas (seg)</label>
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
    </div>
  );
}
