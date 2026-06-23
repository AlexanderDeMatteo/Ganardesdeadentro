'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { ExerciseAnimationPlayer } from '@/components/exercises/exercise-animation-player';
import { ExerciseFormModal } from '@/components/exercises/exercise-form-modal';
import { ExercisePickerPanel } from '@/components/exercises/exercise-picker-panel';
import { cn } from '@/lib/utils';
import type { Routine, RoutineExercise, RoutineStructureType } from '@/lib/data/types';
import { X, Plus, Trash2 } from 'lucide-react';

import type { Exercise } from '@/lib/data/types';

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

function buildWeightArray(count: number, base: number, step: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const w = base + i * step;
    return Number.isInteger(w) ? w : Math.round(w * 10) / 10;
  });
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
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [rest, setRest] = useState(60);
  const [technique, setTechnique] = useState('');
  const [baseWeight, setBaseWeight] = useState('20');
  const [weightStep, setWeightStep] = useState('2.5');
  const [setWeights, setSetWeights] = useState<string[]>(['20', '22.5', '25']);
  const [isExerciseFormOpen, setIsExerciseFormOpen] = useState(false);

  const pickerExercises = useMemo(() => exercises, [exercises]);

  const selectedExercise = useMemo(
    () => pickerExercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [pickerExercises, selectedExerciseId],
  );

  useEffect(() => {
    if (!initialRoutine) return;
    setName(initialRoutine.name);
    setDescription(initialRoutine.description);
    setDifficulty(initialRoutine.difficulty);
    setDuration(initialRoutine.duration);
    setStructureType(initialRoutine.structureType ?? 'standard');
    setSelectedExercises(initialRoutine.exercises);
  }, [initialRoutine]);

  const syncSetWeights = (count: number, weights?: string[]) => {
    if (weights && weights.length === count) {
      setSetWeights(weights);
      return;
    }
    const base = parseFloat(baseWeight.replace(',', '.')) || 20;
    const step = parseFloat(weightStep.replace(',', '.')) || 2.5;
    setSetWeights(buildWeightArray(count, base, step).map(String));
  };

  const handleSetsChange = (value: number) => {
    const next = Math.max(1, Math.min(10, value));
    setSets(next);
    syncSetWeights(next);
  };

  const applyProgression = () => {
    syncSetWeights(sets);
  };

  const handleAddExercise = () => {
    if (!selectedExerciseId) return;
    const exercise = pickerExercises.find((e) => e.id === selectedExerciseId);
    if (!exercise) return;

    const suggestedWeightsKg = setWeights
      .map((w) => parseFloat(w.replace(',', '.')))
      .filter((n) => Number.isFinite(n) && n >= 0);

    const blockConfig =
      structureType === 'series_pull'
        ? {
            romRanges: [
              { from: 'P1', to: 'P2', repsMin: 5, repsMax: 10 },
              { from: 'P2', to: 'P3', repsMin: 5, repsMax: 10 },
              { from: 'P1', to: 'P3', repsMin: 5, repsMax: 10 },
            ],
          }
        : structureType === 'superset'
          ? {
              supersetSubtype,
              steps: [
                { weightKg: parseFloat(baseWeight.replace(',', '.')) || 5, repsTarget: String(reps) },
                { weightKg: (parseFloat(baseWeight.replace(',', '.')) || 5) + 5, repsTarget: String(Math.max(4, reps - 2)) },
              ],
              finisher:
                supersetSubtype === 'progressive'
                  ? { weightKg: parseFloat(baseWeight.replace(',', '.')) || 5, repsTarget: '20' }
                  : undefined,
              maxTransitionRestSec: 30,
            }
          : undefined;

    setSelectedExercises([
      ...selectedExercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: structureType === 'standard' ? sets : 1,
        reps,
        rest,
        suggestedWeightsKg:
          suggestedWeightsKg.length === sets ? suggestedWeightsKg : undefined,
        technique: technique.trim() || undefined,
        blockConfig,
      },
    ]);

    setSelectedExerciseId('');
    setSets(3);
    setReps(10);
    setRest(60);
    setTechnique('');
    syncSetWeights(3);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name || selectedExercises.length === 0) {
      alert('Completa el nombre y agrega al menos un ejercicio');
      return;
    }
    onSave({ name, description, difficulty, duration, structureType, exercises: selectedExercises });
  };

  const weightPreview = useMemo(
    () => setWeights.map((w, i) => `S${i + 1}: ${w || '—'} kg`).join(' · '),
    [setWeights],
  );

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
  const weightInputClass = prime ? inputClass : 'h-9';

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
                onClick={() => setStructureType(value)}
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
                onClick={() => setSupersetSubtype('progressive')}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs',
                  supersetSubtype === 'progressive' ? 'bg-primary/20 text-primary' : 'text-muted-foreground',
                )}
              >
                Progresiva
              </button>
              <button
                type="button"
                onClick={() => setSupersetSubtype('regressive')}
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
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-3">
            <ExercisePickerPanel
              selectedExerciseId={selectedExerciseId}
              onSelectExerciseId={setSelectedExerciseId}
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
              <div className="mt-3">
                <ExerciseAnimationPlayer
                  name={selectedExercise.name}
                  animationUrl={selectedExercise.animationUrl}
                  animationType={selectedExercise.animationType}
                  compact
                />
              </div>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>Series</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={sets}
              onChange={(e) => handleSetsChange(parseInt(e.target.value, 10))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Repeticiones</label>
            <Input
              type="number"
              min={1}
              max={50}
              value={reps}
              onChange={(e) => setReps(parseInt(e.target.value, 10))}
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
              value={rest}
              onChange={(e) => setRest(parseInt(e.target.value, 10))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Técnica (opcional)</label>
            <Input
              placeholder="Puntos clave de ejecución"
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className={progressionPanelClass}>
          <p className={cn('text-xs', prime ? 'gp-label gp-text-phosphor' : 'font-medium')}>
            Progresión de peso
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label className={labelClass}>Peso base (kg)</label>
              <Input
                value={baseWeight}
                onChange={(e) => setBaseWeight(e.target.value)}
                className={weightInputClass}
                inputMode="decimal"
              />
            </div>
            <div>
              <label className={labelClass}>Progresión (+kg/serie)</label>
              <Input
                value={weightStep}
                onChange={(e) => setWeightStep(e.target.value)}
                className={weightInputClass}
                inputMode="decimal"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyProgression}
              className={prime ? 'gp-btn-ghost gp-mono h-9 px-3 text-xs uppercase' : undefined}
            >
              Aplicar progresión
            </Button>
          </div>
          <p className={cn('text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
            Peso sugerido por serie
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {setWeights.map((w, i) => (
              <div key={i}>
                <label className={cn('text-xs', prime ? 'gp-mono gp-text-dim' : 'text-muted-foreground')}>
                  Serie {i + 1}
                </label>
                <Input
                  value={w}
                  onChange={(e) => {
                    const next = [...setWeights];
                    next[i] = e.target.value;
                    setSetWeights(next);
                  }}
                  className={cn(weightInputClass, 'mt-1')}
                  inputMode="decimal"
                />
              </div>
            ))}
          </div>
          <p className={cn('text-xs', prime ? 'gp-mono gp-text-phosphor' : 'text-cyan-600 dark:text-cyan-400')}>
            {weightPreview}
          </p>
        </div>

        <Button
          onClick={handleAddExercise}
          disabled={!selectedExerciseId}
          className={
            prime
              ? 'gp-btn-phosphor gp-mono h-10 w-full text-xs uppercase'
              : 'w-full bg-gradient-to-r from-primary to-secondary'
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Ejercicio
        </Button>
      </div>
    </div>
  );

  const selectedExercisesSection = prime ? (
    <div>
      <h3 className={sectionTitle}>
        Ejercicios seleccionados
        <span className="gp-mono ml-2 text-xs gp-text-dim">({selectedExercises.length})</span>
      </h3>
      {selectedExercises.length > 0 ? (
        <div className="gp-scroll-thin max-h-[min(24dvh,12rem)] space-y-2 overflow-y-auto pr-1">
          {selectedExercises.map((ex, idx) => (
            <div key={idx} className={itemClass}>
              <div className="min-w-0">
                <p className="gp-mono truncate gp-text-primary">{ex.exerciseName}</p>
                <p className="gp-mono text-sm gp-text-muted">
                  {ex.sets} x {ex.reps} · {ex.rest}s descanso
                </p>
                {ex.suggestedWeightsKg?.length ? (
                  <p className="gp-mono mt-1 text-xs gp-text-phosphor">
                    Pesos: {ex.suggestedWeightsKg.map((w, i) => `S${i + 1} ${w}kg`).join(' · ')}
                  </p>
                ) : null}
                {ex.technique ? (
                  <p className="gp-mono mt-1 text-xs gp-text-dim">{ex.technique}</p>
                ) : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveExercise(idx)}
                className="gp-btn-ghost h-8 w-8 shrink-0 p-0 text-[#ffb4ab] hover:border-[#ffb4ab]/50"
                aria-label={`Quitar ${ex.exerciseName}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="gp-empty-slot">Agrega al menos un ejercicio para crear la rutina.</p>
      )}
    </div>
  ) : selectedExercises.length > 0 ? (
    <div>
      <h3 className={sectionTitle}>Ejercicios Seleccionados ({selectedExercises.length})</h3>
      <div className="space-y-2">
        {selectedExercises.map((ex, idx) => (
          <div key={idx} className={itemClass}>
            <div>
              <p className="font-medium">{ex.exerciseName}</p>
              <p className="text-sm text-muted-foreground">
                {ex.sets} x {ex.reps} · {ex.rest}s descanso
              </p>
              {ex.suggestedWeightsKg?.length ? (
                <p className="text-xs mt-1 text-cyan-600 dark:text-cyan-400">
                  Pesos: {ex.suggestedWeightsKg.map((w, i) => `S${i + 1} ${w}kg`).join(' · ')}
                </p>
              ) : null}
              {ex.technique ? (
                <p className="text-xs mt-1 text-muted-foreground">{ex.technique}</p>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveExercise(idx)}
              className="h-8 w-8 p-0 border-destructive/30 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  ) : null;

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
            setSelectedExerciseId(exercise.id);
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
          <div className="flex items-center justify-between border-b border-secondary/20 sticky top-0 bg-card px-8 py-6">
            <h2 className="text-2xl font-bold">
              {mode === 'edit' ? 'Editar Rutina' : 'Crear Nueva Rutina'}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0 border-secondary/30">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-8 py-8">{body}</div>

          <div className="border-t border-secondary/20 sticky bottom-0 bg-card px-8 py-4">{footer}</div>
        </div>
      </div>
      <ExerciseFormModal
        open={isExerciseFormOpen}
        onClose={() => setIsExerciseFormOpen(false)}
        onSaved={async (exercise) => {
          await onExercisesChanged?.();
          setSelectedExerciseId(exercise.id);
          setIsExerciseFormOpen(false);
        }}
      />
    </>
  );
}
