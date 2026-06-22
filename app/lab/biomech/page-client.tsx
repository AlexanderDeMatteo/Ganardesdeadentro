'use client';

import { useState } from 'react';

import { ExerciseViewer } from '@/components/biomechanics/exercise-viewer';
import { cn } from '@/lib/utils';

const EXERCISES = [
  { id: 'deadlift_01', label: 'Peso Muerto' },
  { id: 'squat_01', label: 'Sentadilla' },
  { id: 'bench_01', label: 'Press de Banca' },
];

export default function BiomechLabClient() {
  const [exerciseId, setExerciseId] = useState('deadlift_01');

  return (
    <main className="min-h-screen bg-[#080c09] px-4 py-8 text-[#dce5de]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#68ca62]">
            BE A GAINER // LAB BIOMECÁNICO
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Visor de activación muscular</h1>
          <p className="mt-1 text-xs text-[#8fa88a]">
            Mueve el slider o presiona Play para ver qué músculos se activan en cada fase.
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-2">
          {EXERCISES.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => setExerciseId(exercise.id)}
              className={cn(
                'border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors',
                exerciseId === exercise.id
                  ? 'border-[#68ca62] bg-[#68ca62]/15 text-[#68ca62]'
                  : 'border-[#68ca62]/25 text-[#8fa88a] hover:border-[#68ca62]/60',
              )}
            >
              {exercise.label}
            </button>
          ))}
        </div>

        <ExerciseViewer key={exerciseId} exerciseId={exerciseId} />
      </div>
    </main>
  );
}
