'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Exercise } from '@/hooks/use-admin';
import type { RoutineExercise } from '@/lib/data/types';
import { X, Plus, Trash2 } from 'lucide-react';

interface RoutineBuilderProps {
  exercises: Exercise[];
  onSave: (data: {
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'expert';
    duration: number;
    exercises: RoutineExercise[];
  }) => void;
  onClose: () => void;
}

function buildWeightArray(count: number, base: number, step: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const w = base + i * step;
    return Number.isInteger(w) ? w : Math.round(w * 10) / 10;
  });
}

export function RoutineBuilder({ exercises, onSave, onClose }: RoutineBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [duration, setDuration] = useState(60);
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [rest, setRest] = useState(60);
  const [technique, setTechnique] = useState('');
  const [baseWeight, setBaseWeight] = useState('20');
  const [weightStep, setWeightStep] = useState('2.5');
  const [setWeights, setSetWeights] = useState<string[]>(['20', '22.5', '25']);

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
    const exercise = exercises.find((e) => e.id === selectedExerciseId);
    if (!exercise) return;

    const suggestedWeightsKg = setWeights
      .map((w) => parseFloat(w.replace(',', '.')))
      .filter((n) => Number.isFinite(n) && n >= 0);

    setSelectedExercises([
      ...selectedExercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets,
        reps,
        rest,
        suggestedWeightsKg:
          suggestedWeightsKg.length === sets ? suggestedWeightsKg : undefined,
        technique: technique.trim() || undefined,
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
    onSave({ name, description, difficulty, duration, exercises: selectedExercises });
  };

  const weightPreview = useMemo(
    () => setWeights.map((w, i) => `S${i + 1}: ${w || '—'} kg`).join(' · '),
    [setWeights],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-secondary/20 bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-secondary/20 sticky top-0 bg-card px-8 py-6">
          <h2 className="text-2xl font-bold">Crear Nueva Rutina</h2>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0 border-secondary/30">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-8 py-8 space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de la Rutina</label>
                <Input
                  placeholder="ej: Upper Body A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 bg-background border-secondary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  placeholder="Describe los objetivos de esta rutina..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg bg-background border border-secondary/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dificultad</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                    className="w-full rounded-lg bg-background border border-secondary/30 px-4 py-2 text-sm"
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="expert">Experto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duración (minutos)</label>
                  <Input
                    type="number"
                    min={15}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                    className="h-11 bg-background border-secondary/30"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Agregar Ejercicios</h3>
            <div className="space-y-4 rounded-xl border border-secondary/20 bg-secondary/5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Ejercicio</label>
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    className="w-full rounded-lg bg-background border border-secondary/30 px-4 py-2 text-sm"
                  >
                    <option value="">Selecciona un ejercicio</option>
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.targetMuscle})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Series</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={sets}
                    onChange={(e) => handleSetsChange(parseInt(e.target.value, 10))}
                    className="h-10 bg-background border-secondary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Repeticiones</label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value, 10))}
                    className="h-10 bg-background border-secondary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descanso (seg)</label>
                  <Input
                    type="number"
                    min={30}
                    max={300}
                    step={30}
                    value={rest}
                    onChange={(e) => setRest(parseInt(e.target.value, 10))}
                    className="h-10 bg-background border-secondary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Técnica (opcional)</label>
                  <Input
                    placeholder="Puntos clave de ejecución"
                    value={technique}
                    onChange={(e) => setTechnique(e.target.value)}
                    className="h-10 bg-background border-secondary/30"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Peso base (kg)</label>
                    <Input
                      value={baseWeight}
                      onChange={(e) => setBaseWeight(e.target.value)}
                      className="h-9 w-24"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Progresión (+kg/serie)</label>
                    <Input
                      value={weightStep}
                      onChange={(e) => setWeightStep(e.target.value)}
                      className="h-9 w-24"
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={applyProgression}>
                    Aplicar progresión
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Peso sugerido por serie</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {setWeights.map((w, i) => (
                    <div key={i}>
                      <label className="text-xs text-muted-foreground">Serie {i + 1}</label>
                      <Input
                        value={w}
                        onChange={(e) => {
                          const next = [...setWeights];
                          next[i] = e.target.value;
                          setSetWeights(next);
                        }}
                        className="h-9 mt-1"
                        inputMode="decimal"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-cyan-600 dark:text-cyan-400">{weightPreview}</p>
              </div>

              <Button
                onClick={handleAddExercise}
                disabled={!selectedExerciseId}
                className="w-full bg-gradient-to-r from-primary to-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Ejercicio
              </Button>
            </div>
          </div>

          {selectedExercises.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Ejercicios Seleccionados</h3>
              <div className="space-y-2">
                {selectedExercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between rounded-lg bg-secondary/5 p-4 border border-secondary/20"
                  >
                    <div>
                      <p className="font-medium">{ex.exerciseName}</p>
                      <p className="text-sm text-muted-foreground">
                        {ex.sets} x {ex.reps} · {ex.rest}s descanso
                      </p>
                      {ex.suggestedWeightsKg?.length ? (
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                          Pesos: {ex.suggestedWeightsKg.map((w, i) => `S${i + 1} ${w}kg`).join(' · ')}
                        </p>
                      ) : null}
                      {ex.technique ? (
                        <p className="text-xs text-muted-foreground mt-1">{ex.technique}</p>
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
          )}
        </div>

        <div className="border-t border-secondary/20 sticky bottom-0 bg-card px-8 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-secondary">
            Crear Rutina
          </Button>
        </div>
      </div>
    </div>
  );
}
