'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { ExerciseAnimationPlayer } from '@/components/exercises/exercise-animation-player';
import { ExerciseFormModal } from '@/components/exercises/exercise-form-modal';
import { ExercisePickerPanel } from '@/components/exercises/exercise-picker-panel';
import { SeriesPullExerciseForm } from '@/components/admin/routine-forms/series-pull-exercise-form';
import { StandardExerciseForm } from '@/components/admin/routine-forms/standard-exercise-form';
import { SupersetExerciseForm } from '@/components/admin/routine-forms/superset-exercise-form';
import { cn } from '@/lib/utils';
import type { Routine, RoutineExercise, RoutineStructureType } from '@/lib/data/types';
import {
  buildSeriesPullBlockConfig,
  buildSupersetBlockConfig,
  createDefaultSeriesPullDraft,
  createDefaultStandardDraft,
  createDefaultSupersetDraft,
  formatExerciseSummary,
  parseStandardWeights,
  parseSuggestedWeightKg,
  romDraftToRange,
  seriesPullDraftFromExercise,
  standardDraftFromExercise,
  supersetDraftFromExercise,
  validateSeriesPullDraft,
  validateStandardDraft,
  validateSupersetDraft,
  type SeriesPullExerciseDraft,
  type StandardExerciseDraft,
  type SupersetExerciseDraft,
} from '@/lib/routines/exercise-block-config';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import type { Exercise } from '@/lib/data/types';

function routineExerciseToPickerStub(ex: RoutineExercise): Exercise {
  return {
    id: ex.exerciseId,
    name: ex.exerciseName,
    targetMuscle: 'general',
    difficulty: 'intermediate',
    equipment: 'body weight',
  };
}

interface RoutineBuilderProps {
  exercises: Exercise[];
  mode?: 'create' | 'edit';
  initialRoutine?: Routine;
  onSave: (data: {
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'expert';
    duration: number;
    structureType: RoutineStructureType;
    exercises: RoutineExercise[];
  }) => void;
  onClose: () => void;
  onExercisesChanged?: () => void | Promise<void>;
  prime?: boolean;
}

export function RoutineBuilder({
  exercises,
  mode = 'create',
  initialRoutine,
  onSave,
  onClose,
  onExercisesChanged,
  prime = false,
}: RoutineBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [duration, setDuration] = useState(60);
  const [structureType, setStructureType] = useState<RoutineStructureType>('standard');
  const [supersetSubtype, setSupersetSubtype] = useState<'progressive' | 'regressive'>('progressive');
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [selectedPickerExercise, setSelectedPickerExercise] = useState<Exercise | null>(null);
  const [standardDraft, setStandardDraft] = useState<StandardExerciseDraft>(createDefaultStandardDraft);
  const [seriesPullDraft, setSeriesPullDraft] = useState<SeriesPullExerciseDraft>(
    createDefaultSeriesPullDraft(),
  );
  const [supersetDraft, setSupersetDraft] = useState<SupersetExerciseDraft>(
    createDefaultSupersetDraft('progressive'),
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isExerciseFormOpen, setIsExerciseFormOpen] = useState(false);

  const selectedExerciseId = selectedPickerExercise?.id ?? '';

  const selectedExercise = selectedPickerExercise;

  useEffect(() => {
    if (!initialRoutine) return;
    setName(initialRoutine.name);
    setDescription(initialRoutine.description);
    setDifficulty(initialRoutine.difficulty);
    setDuration(initialRoutine.duration);
    const st = initialRoutine.structureType ?? 'standard';
    setStructureType(st);
    setSelectedExercises(initialRoutine.exercises);
    const firstSuperset = initialRoutine.exercises.find((ex) => ex.blockConfig?.supersetSubtype);
    if (firstSuperset?.blockConfig?.supersetSubtype) {
      setSupersetSubtype(firstSuperset.blockConfig.supersetSubtype);
    }
  }, [initialRoutine]);

  const resetFormDrafts = () => {
    setStandardDraft(createDefaultStandardDraft());
    setSeriesPullDraft(createDefaultSeriesPullDraft());
    setSupersetDraft(createDefaultSupersetDraft(supersetSubtype));
    setEditingIndex(null);
    setFormError(null);
  };

  const resetDrafts = () => {
    resetFormDrafts();
    setSelectedPickerExercise(null);
  };

  const buildExerciseEntry = (exercise: Exercise): RoutineExercise | null => {
    if (structureType === 'standard') {
      const validation = validateStandardDraft(standardDraft);
      if (!validation.ok) {
        setFormError(validation.error);
        toast.error(validation.error);
        return null;
      }
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: standardDraft.sets,
        reps: standardDraft.reps,
        rest: standardDraft.rest,
        suggestedWeightsKg: parseStandardWeights(standardDraft),
        technique: standardDraft.technique.trim() || undefined,
      };
    }

    if (structureType === 'series_pull') {
      const validation = validateSeriesPullDraft(seriesPullDraft);
      if (!validation.ok) {
        setFormError(validation.error);
        toast.error(validation.error);
        return null;
      }
      const romRanges = seriesPullDraft.romRanges.map(romDraftToRange);
      const lastRange = romRanges[romRanges.length - 1];
      const weight = parseSuggestedWeightKg(seriesPullDraft.suggestedWeightKg);
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: 1,
        reps: lastRange?.repsMax ?? 10,
        rest: seriesPullDraft.rest,
        suggestedWeightsKg: weight != null ? [weight] : undefined,
        technique: seriesPullDraft.technique.trim() || undefined,
        blockConfig: buildSeriesPullBlockConfig(seriesPullDraft),
      };
    }

    const validation = validateSupersetDraft(supersetDraft, supersetSubtype);
    if (!validation.ok) {
      setFormError(validation.error);
      toast.error(validation.error);
      return null;
    }
    const firstStep = supersetDraft.steps[0];
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 1,
      reps: parseInt(firstStep.repsTarget, 10) || 10,
      rest: supersetDraft.rest,
      suggestedWeightsKg: firstStep.weightKg ?
        [parseFloat(firstStep.weightKg.replace(',', '.')) || 0]
      : undefined,
      technique: supersetDraft.technique.trim() || undefined,
      blockConfig: buildSupersetBlockConfig(supersetDraft, supersetSubtype),
    };
  };

  const handleAddOrUpdateExercise = () => {
    const exercise =
      selectedPickerExercise ??
      (selectedExerciseId ? exercises.find((e) => e.id === selectedExerciseId) : undefined);
    if (!exercise) {
      toast.error('Selecciona un ejercicio de la lista antes de agregar.');
      return;
    }

    const entry = buildExerciseEntry(exercise);
    if (!entry) return;

    setFormError(null);

    if (editingIndex != null) {
      const next = [...selectedExercises];
      next[editingIndex] = entry;
      setSelectedExercises(next);
    } else {
      setSelectedExercises([...selectedExercises, entry]);
    }

    resetDrafts();
  };

  const handleEditExercise = (index: number) => {
    const ex = selectedExercises[index];
    if (!ex) return;
    setEditingIndex(index);
    const picked =
      exercises.find((e) => e.id === ex.exerciseId) ?? routineExerciseToPickerStub(ex);
    setSelectedPickerExercise(picked);
    setFormError(null);

    if (structureType === 'standard') {
      setStandardDraft(standardDraftFromExercise(ex));
    } else if (structureType === 'series_pull') {
      setSeriesPullDraft(seriesPullDraftFromExercise(ex));
    } else {
      const subtype = ex.blockConfig?.supersetSubtype ?? supersetSubtype;
      if (subtype !== supersetSubtype) setSupersetSubtype(subtype);
      setSupersetDraft(supersetDraftFromExercise(ex));
    }
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
    if (editingIndex === index) resetDrafts();
    else if (editingIndex != null && index < editingIndex) setEditingIndex(editingIndex - 1);
  };

  const handleCancelEdit = () => {
    resetDrafts();
  };

  const handleSave = () => {
    if (!name || selectedExercises.length === 0) {
      alert('Completa el nombre y agrega al menos un ejercicio');
      return;
    }
    onSave({ name, description, difficulty, duration, structureType, exercises: selectedExercises });
  };

  const labelClass = prime
    ? 'gp-mono mb-1.5 block text-xs uppercase gp-text-dim'
    : 'block text-sm font-medium mb-2';
  const sectionTitle = prime
    ? 'gp-label gp-section-title gp-text-phosphor'
    : 'text-lg font-semibold mb-4';
  const inputClass = prime
    ? 'gp-field gp-mono h-9 rounded-lg px-3 text-sm'
    : 'h-10 bg-background border-secondary/30';
  const inputClassLg = prime
    ? 'gp-field gp-mono h-9 rounded-lg px-3 text-sm'
    : 'h-11 bg-background border-secondary/30';
  const selectClass = prime
    ? 'gp-field gp-mono h-9 w-full rounded-lg px-3 text-sm'
    : 'w-full rounded-lg bg-background border border-secondary/30 px-4 py-2 text-sm';
  const textareaClass = prime
    ? 'gp-field gp-mono w-full rounded-lg px-3 py-2 text-sm resize-y min-h-[4.5rem]'
    : 'w-full rounded-lg bg-background border border-secondary/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
  const panelClass = prime
    ? 'gp-form-panel space-y-4 p-4 sm:p-5'
    : 'space-y-4 rounded-xl border border-secondary/20 bg-secondary/5 p-6';
  const itemClass = prime
    ? 'flex items-start justify-between gap-3 rounded-lg border gp-border-outline gp-bg-surface-high p-3'
    : 'flex items-start justify-between rounded-lg bg-secondary/5 p-4 border border-secondary/20';

  const progressionPanelClass = cn(
    'space-y-3 rounded-lg p-4',
    prime ? 'gp-form-subpanel' : 'border border-border bg-background/50',
  );

  const formStyles = {
    prime,
    labelClass,
    inputClass,
    selectClass,
    progressionPanelClass,
    weightInputClass: prime ? inputClass : 'h-9',
  };

  const structureForm =
    structureType === 'standard' ? (
      <StandardExerciseForm draft={standardDraft} onChange={setStandardDraft} {...formStyles} />
    ) : structureType === 'series_pull' ? (
      <SeriesPullExerciseForm draft={seriesPullDraft} onChange={setSeriesPullDraft} {...formStyles} />
    ) : (
      <SupersetExerciseForm
        draft={supersetDraft}
        subtype={supersetSubtype}
        onChange={setSupersetDraft}
        {...formStyles}
      />
    );

  const basicInfoSection = (
    <div>
      <h3 className={sectionTitle}>Información Básica</h3>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Nombre de la Rutina</label>
          <Input
            placeholder="ej: Upper Body A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClassLg}
          />
        </div>
        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            placeholder="Describe los objetivos de esta rutina..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={textareaClass}
            rows={prime ? 2 : 3}
          />
        </div>
        <div>
          <label className={labelClass}>Tipo de estructura</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['standard', 'Formulario base'],
                ['series_pull', 'Series Pull'],
                ['superset', 'Super series'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStructureType(value);
                  resetFormDrafts();
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  structureType === value
                    ? prime
                      ? 'gp-bg-phosphor gp-text-on-phosphor'
                      : 'bg-primary text-primary-foreground'
                    : prime
                      ? 'gp-bg-surface-high gp-text-muted'
                      : 'bg-secondary/10 text-muted-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {structureType === 'superset' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSupersetSubtype('progressive');
                  if (editingIndex == null) setSupersetDraft(createDefaultSupersetDraft('progressive'));
                }}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs',
                  supersetSubtype === 'progressive' ? 'bg-primary/20 text-primary' : 'text-muted-foreground',
                )}
              >
                Progresiva
              </button>
              <button
                type="button"
                onClick={() => {
                  setSupersetSubtype('regressive');
                  if (editingIndex == null) setSupersetDraft(createDefaultSupersetDraft('regressive'));
                }}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs',
                  supersetSubtype === 'regressive' ? 'bg-primary/20 text-primary' : 'text-muted-foreground',
                )}
              >
                Regresiva
              </button>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Dificultad</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className={selectClass}
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="expert">Experto</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Duración (minutos)</label>
            <Input
              type="number"
              min={15}
              max={180}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className={inputClassLg}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const addExerciseSection = (
    <div>
      <h3 className={sectionTitle}>Agregar Ejercicios</h3>
      <div className={panelClass}>
        <div className="space-y-3">
          <ExercisePickerPanel
            selectedExerciseId={selectedExerciseId}
            onSelectExercise={setSelectedPickerExercise}
            fallbackExercises={exercises}
            prime={prime}
            labelClass={labelClass}
            selectClass={selectClass}
            inputClass={inputClass}
          />
          <Button
            type="button"
            variant="outline"
            className={prime ? 'gp-mono shrink-0' : 'shrink-0'}
            onClick={() => setIsExerciseFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear ejercicio
          </Button>
          {selectedExercise ? (
            <div className="space-y-1">
              <ExerciseAnimationPlayer
                name={selectedExercise.name}
                animationUrl={selectedExercise.animationUrl}
                animationType={selectedExercise.animationType}
                compact
              />
              {!selectedExercise.animationUrl || selectedExercise.animationType === 'none' ? (
                <p className={cn('text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
                  Puedes agregar este ejercicio aunque no tenga animación.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {structureForm}

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAddOrUpdateExercise}
            disabled={!selectedExerciseId}
            className={
              prime
                ? 'gp-btn-phosphor gp-mono h-10 flex-1 text-xs uppercase'
                : 'flex-1 bg-gradient-to-r from-primary to-secondary'
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            {editingIndex != null ? 'Actualizar ejercicio' : 'Agregar ejercicio'}
          </Button>
          {editingIndex != null ? (
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Cancelar edición
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderExerciseItem = (ex: RoutineExercise, idx: number) => {
    const summary = formatExerciseSummary(ex, structureType);
    return (
      <div key={`${ex.exerciseId}-${idx}`} className={itemClass}>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate font-medium', prime ? 'gp-mono gp-text-primary' : '')}>
            {ex.exerciseName}
          </p>
          <p className={cn('text-sm', prime ? 'gp-mono gp-text-muted' : 'text-muted-foreground')}>
            {summary.primary}
          </p>
          {summary.secondary ? (
            <p className={cn('mt-1 text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
              {summary.secondary}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditExercise(idx)}
            className={prime ? 'gp-btn-ghost h-8 w-8 p-0' : 'h-8 w-8 p-0'}
            aria-label={`Editar ${ex.exerciseName}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemoveExercise(idx)}
            className={
              prime
                ? 'gp-btn-ghost h-8 w-8 p-0 text-[#ffb4ab] hover:border-[#ffb4ab]/50'
                : 'h-8 w-8 p-0 border-destructive/30 text-destructive'
            }
            aria-label={`Quitar ${ex.exerciseName}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const selectedExercisesSection = (
    <div>
      <h3 className={sectionTitle}>
        Ejercicios seleccionados
        {prime ? (
          <span className="gp-mono ml-2 text-xs gp-text-dim">({selectedExercises.length})</span>
        ) : (
          <span className="text-base font-normal text-muted-foreground">
            {' '}
            ({selectedExercises.length})
          </span>
        )}
      </h3>
      {selectedExercises.length > 0 ? (
        <div
          className={
            prime ?
              'gp-scroll-thin max-h-[min(24dvh,12rem)] space-y-2 overflow-y-auto pr-1'
            : 'space-y-2'
          }
        >
          {selectedExercises.map(renderExerciseItem)}
        </div>
      ) : (
        <p className={prime ? 'gp-empty-slot' : 'text-sm text-muted-foreground'}>
          Agrega al menos un ejercicio para crear la rutina.
        </p>
      )}
    </div>
  );

  const body = prime ? (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="gp-form-panel p-4 sm:p-5">{basicInfoSection}</div>
      <div className="space-y-5">
        {addExerciseSection}
        {selectedExercisesSection}
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      {basicInfoSection}
      {addExerciseSection}
      {selectedExercisesSection}
    </div>
  );

  const footer = prime ? (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="gp-mono text-xs gp-text-dim">
        {selectedExercises.length > 0
          ? `${selectedExercises.length} ejercicio${selectedExercises.length === 1 ? '' : 's'} · ${duration} min`
          : 'Nombre + al menos 1 ejercicio requeridos'}
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} className="gp-btn-ghost gp-mono text-xs uppercase">
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || selectedExercises.length === 0}
          className="gp-btn-phosphor gp-mono text-xs uppercase"
        >
          {mode === 'edit' ? 'Guardar rutina' : 'Crear rutina'}
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-secondary">
        {mode === 'edit' ? 'Guardar rutina' : 'Crear rutina'}
      </Button>
    </div>
  );

  if (prime) {
    return (
      <>
        <PrimeScrollableModal
          title={mode === 'edit' ? 'Editar rutina' : 'Crear rutina'}
          modId="32"
          onClose={onClose}
          footer={footer}
          size="full"
          maxWidth="max-w-[min(72rem,calc(100vw-2rem))]"
        >
          {body}
        </PrimeScrollableModal>
        <ExerciseFormModal
          open={isExerciseFormOpen}
          onClose={() => setIsExerciseFormOpen(false)}
          prime
          onSaved={async (exercise) => {
            await onExercisesChanged?.();
            setSelectedPickerExercise(exercise);
            setIsExerciseFormOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-secondary/20 bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-secondary/20 sticky top-0 bg-card px-4 py-4 sm:px-6 sm:py-6 md:px-8">
            <h2 className="text-xl font-bold sm:text-2xl">
              {mode === 'edit' ? 'Editar Rutina' : 'Crear Nueva Rutina'}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0 border-secondary/30">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8">{body}</div>

          <div className="border-t border-secondary/20 sticky bottom-0 bg-card px-4 py-4 sm:px-6 md:px-8">{footer}</div>
        </div>
      </div>
      <ExerciseFormModal
        open={isExerciseFormOpen}
        onClose={() => setIsExerciseFormOpen(false)}
        onSaved={async (exercise) => {
          await onExercisesChanged?.();
          setSelectedPickerExercise(exercise);
          setIsExerciseFormOpen(false);
        }}
      />
    </>
  );
}
