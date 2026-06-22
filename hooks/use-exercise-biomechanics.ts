'use client';

import { useEffect, useState } from 'react';

import type { ExerciseBiomechanics } from '@/lib/api/contracts/biomechanics';

interface UseExerciseBiomechanicsResult {
  data: ExerciseBiomechanics | null;
  isLoading: boolean;
  error: string | null;
}

export function useExerciseBiomechanics(exerciseId: string): UseExerciseBiomechanicsResult {
  const [data, setData] = useState<ExerciseBiomechanics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/exercises/${exerciseId}/biomechanics`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`No se pudo cargar el ejercicio (${res.status})`);
        }
        const payload = (await res.json()) as ExerciseBiomechanics;
        setData(payload);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setData(null);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [exerciseId]);

  return { data, isLoading, error };
}
