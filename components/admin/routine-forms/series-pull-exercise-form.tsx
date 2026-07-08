'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  REPS_PULL_MAX,
  REPS_PULL_MIN,
  type SeriesPullExerciseDraft,
} from '@/lib/routines/exercise-block-config';
import type { RoutineFormStyles } from '@/components/admin/routine-forms/routine-form-styles';

type SeriesPullExerciseFormProps = RoutineFormStyles & {
  draft: SeriesPullExerciseDraft;
  onChange: (draft: SeriesPullExerciseDraft) => void;
};

export function SeriesPullExerciseForm({
  draft,
  onChange,
  prime,
  labelClass,
  inputClass,
  selectClass,
}: SeriesPullExerciseFormProps) {
  const updateRange = (index: number, patch: Partial<SeriesPullExerciseDraft['romRanges'][number]>) => {
    const romRanges = draft.romRanges.map((range, i) =>
      i === index ? { ...range, ...patch } : range,
    );
    onChange({ ...draft, romRanges });
  };

  return (
    <div className="space-y-4">
      <p className={cn('text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
        Una serie compuesta por 3 rangos consecutivos. Descanso solo entre series completas.
      </p>

      {draft.romRanges.map((range, index) => (
        <div
          key={`${range.from}-${range.to}`}
          className={cn(
            'space-y-3 rounded-lg border p-3',
            prime ? 'gp-border-outline gp-bg-surface-high/40' : 'border-border bg-background/50',
          )}
        >
          <p className={cn('text-sm font-medium', prime ? 'gp-mono gp-text-primary' : '')}>
            Rango {index + 1}: {range.from} → {range.to}
          </p>
          <div>
            <label className={labelClass}>Modo reps</label>
            <select
              value={range.mode}
              onChange={(e) =>
                updateRange(index, { mode: e.target.value as 'fixed' | 'range' })
              }
              className={selectClass}
            >
              <option value="fixed">Fijas</option>
              <option value="range">Rango (min–max)</option>
            </select>
          </div>
          {range.mode === 'fixed' ? (
            <div>
              <label className={labelClass}>Repeticiones ({REPS_PULL_MIN}–{REPS_PULL_MAX})</label>
              <Input
                type="number"
                min={REPS_PULL_MIN}
                max={REPS_PULL_MAX}
                value={range.repsFixed}
                onChange={(e) =>
                  updateRange(index, { repsFixed: parseInt(e.target.value, 10) || REPS_PULL_MIN })
                }
                className={inputClass}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Reps mín</label>
                <Input
                  type="number"
                  min={REPS_PULL_MIN}
                  max={REPS_PULL_MAX}
                  value={range.repsMin}
                  onChange={(e) =>
                    updateRange(index, { repsMin: parseInt(e.target.value, 10) || REPS_PULL_MIN })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Reps máx</label>
                <Input
                  type="number"
                  min={REPS_PULL_MIN}
                  max={REPS_PULL_MAX}
                  value={range.repsMax}
                  onChange={(e) =>
                    updateRange(index, { repsMax: parseInt(e.target.value, 10) || REPS_PULL_MAX })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>
      ))}

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
          <label className={labelClass}>Peso sugerido (kg, opcional)</label>
          <Input
            value={draft.suggestedWeightKg}
            onChange={(e) => onChange({ ...draft, suggestedWeightKg: e.target.value })}
            className={inputClass}
            inputMode="decimal"
            placeholder="Ej: 20"
          />
        </div>
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
  );
}
