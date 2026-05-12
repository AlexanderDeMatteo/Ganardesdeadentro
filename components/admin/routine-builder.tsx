'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Exercise } from '@/hooks/use-admin';
import { X, Plus, Trash2 } from 'lucide-react';

interface ExerciseInRoutine {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  rest: number;
}

interface RoutineBuilderProps {
  exercises: Exercise[];
  onSave: (data: {
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'expert';
    duration: number;
    exercises: ExerciseInRoutine[];
  }) => void;
  onClose: () => void;
}

export function RoutineBuilder({ exercises, onSave, onClose }: RoutineBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [duration, setDuration] = useState(60);
  const [selectedExercises, setSelectedExercises] = useState<ExerciseInRoutine[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [rest, setRest] = useState(60);

  const handleAddExercise = () => {
    if (!selectedExerciseId) return;

    const exercise = exercises.find(e => e.id === selectedExerciseId);
    if (!exercise) return;

    setSelectedExercises([
      ...selectedExercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets,
        reps,
        rest,
      },
    ]);

    setSelectedExerciseId('');
    setSets(3);
    setReps(10);
    setRest(60);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name || selectedExercises.length === 0) {
      alert('Completa el nombre y agrega al menos un ejercicio');
      return;
    }

    onSave({
      name,
      description,
      difficulty,
      duration,
      exercises: selectedExercises,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-secondary/20 bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-secondary/20 sticky top-0 bg-card px-8 py-6">
          <h2 className="text-2xl font-bold">Crear Nueva Rutina</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 border-secondary/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Información Básica */}
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
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-lg bg-background border border-secondary/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                    min="15"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="h-11 bg-background border-secondary/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Agregar Ejercicios */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Agregar Ejercicios</h3>
            <div className="space-y-4 rounded-xl border border-secondary/20 bg-secondary/5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ejercicio</label>
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    className="w-full rounded-lg bg-background border border-secondary/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                    min="1"
                    max="10"
                    value={sets}
                    onChange={(e) => setSets(parseInt(e.target.value))}
                    className="h-10 bg-background border-secondary/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Repeticiones</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value))}
                    className="h-10 bg-background border-secondary/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descanso (seg)</label>
                  <Input
                    type="number"
                    min="30"
                    max="300"
                    step="30"
                    value={rest}
                    onChange={(e) => setRest(parseInt(e.target.value))}
                    className="h-10 bg-background border-secondary/30"
                  />
                </div>
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

          {/* Lista de Ejercicios */}
          {selectedExercises.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Ejercicios Seleccionados</h3>
              <div className="space-y-2">
                {selectedExercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-secondary/5 p-4 border border-secondary/20"
                  >
                    <div>
                      <p className="font-medium">{ex.exerciseName}</p>
                      <p className="text-sm text-muted-foreground">
                        {ex.sets} x {ex.reps} • {ex.rest}s descanso
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveExercise(idx)}
                      className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
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
          <Button
            variant="outline"
            onClick={onClose}
            className="border-secondary/30 text-secondary hover:bg-secondary/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            Crear Rutina
          </Button>
        </div>
      </div>
    </div>
  );
}
