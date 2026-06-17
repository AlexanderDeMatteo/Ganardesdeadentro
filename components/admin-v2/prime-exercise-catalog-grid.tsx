'use client';

import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeSearchInput } from '@/components/admin-v2/prime-search-input';
import { ExerciseAnimationPlayer } from '@/components/exercises/exercise-animation-player';
import type { Exercise } from '@/lib/data/types';
import { Pencil, RefreshCw, Trash2, Upload } from 'lucide-react';

export type PrimeExerciseGridMode = 'catalog' | 'custom';

type PrimeExerciseCatalogGridProps = {
  exercises: Exercise[];
  mode: PrimeExerciseGridMode;
  search?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  canManage?: (exercise: Exercise) => boolean;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exerciseId: string) => void;
  onMatch?: (exercise: Exercise) => void;
  onUpload?: (exercise: Exercise) => void;
  emptyMessage?: string;
};

export function PrimeExerciseCatalogGrid({
  exercises,
  mode,
  search = '',
  onSearchChange,
  showSearch = false,
  canManage,
  onEdit,
  onDelete,
  onMatch,
  onUpload,
  emptyMessage,
}: PrimeExerciseCatalogGridProps) {
  const defaultEmpty =
    mode === 'catalog'
      ? 'Sin ejercicios en este filtro. Elige un músculo o sincroniza el catálogo.'
      : 'Aún no tienes ejercicios custom. Crea uno para empezar.';

  return (
    <div className="space-y-4 p-4">
      {showSearch && onSearchChange ? (
        <PrimeSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar ejercicio..."
          ariaLabel="Buscar ejercicios"
        />
      ) : null}
      {exercises.length === 0 ? (
        <p className="gp-mono py-8 text-center text-sm gp-text-muted">
          {emptyMessage ?? defaultEmpty}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => {
            const manageable = mode === 'custom' && (canManage?.(exercise) ?? true);
            return (
              <article
                key={exercise.id}
                className="gp-module gp-module-corner flex flex-col gap-3 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="gp-display text-base gp-text-primary">{exercise.name}</h3>
                    <p className="gp-mono text-xs gp-text-muted">
                      {exercise.targetMuscle} · {exercise.equipment}
                      {exercise.isCustom ? ' · custom' : ''}
                    </p>
                  </div>
                  <span className="gp-mono rounded px-2 py-1 text-[10px] gp-bg-surface-high gp-text-muted">
                    {exercise.difficulty}
                  </span>
                </div>
                <ExerciseAnimationPlayer
                  name={exercise.name}
                  animationUrl={exercise.animationUrl}
                  animationType={exercise.animationType}
                  compact
                />
                {manageable ? (
                  <div className="flex flex-wrap gap-2">
                    {onEdit ? (
                      <PrimeChamferButton
                        type="button"
                        onClick={() => onEdit(exercise)}
                        className="px-3 py-2 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </PrimeChamferButton>
                    ) : null}
                    {onMatch ? (
                      <PrimeChamferButton
                        type="button"
                        onClick={() => onMatch(exercise)}
                        className="px-3 py-2 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Buscar GIF
                      </PrimeChamferButton>
                    ) : null}
                    {onUpload ? (
                      <PrimeChamferButton
                        type="button"
                        onClick={() => onUpload(exercise)}
                        className="px-3 py-2 text-xs"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Subir
                      </PrimeChamferButton>
                    ) : null}
                    {onDelete ? (
                      <PrimeChamferButton
                        type="button"
                        onClick={() => onDelete(exercise.id)}
                        className="bg-red-900/40 px-3 py-2 text-xs text-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </PrimeChamferButton>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
