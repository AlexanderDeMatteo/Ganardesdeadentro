'use client';

import { useMemo } from 'react';

import type { ExercisePhase, MuscleGroup } from '@/lib/api/contracts/biomechanics';
import { ANTAGONIST_FACTOR } from '@/lib/biomechanics/muscle-map';

export interface BiomechanicsState {
  faseActiva: ExercisePhase | null;
  faseIndex: number;
  activaciones: Record<MuscleGroup, number>;
}

const EMPTY_ACTIVATIONS: Record<MuscleGroup, number> = {
  gluteos: 0,
  isquiosurales: 0,
  cuadriceps: 0,
  erectores: 0,
  dorsales: 0,
  abdominales: 0,
  pectoral: 0,
  deltoides: 0,
  biceps: 0,
  triceps: 0,
  gemelos: 0,
  trapecio: 0,
};

function findPhaseIndex(fases: ExercisePhase[], progress: number): number {
  const clamped = Math.min(100, Math.max(0, progress));
  for (let i = 0; i < fases.length; i += 1) {
    const [start, end] = fases[i].rango;
    const isLast = i === fases.length - 1;
    if (clamped >= start && (clamped < end || (isLast && clamped <= end))) {
      return i;
    }
  }
  return fases.length > 0 ? fases.length - 1 : -1;
}

export function useBiomechanicsState(
  fases: ExercisePhase[] | undefined,
  progress: number,
): BiomechanicsState {
  return useMemo(() => {
    if (!fases || fases.length === 0) {
      return { faseActiva: null, faseIndex: -1, activaciones: { ...EMPTY_ACTIVATIONS } };
    }

    const faseIndex = findPhaseIndex(fases, progress);
    const faseActiva = faseIndex >= 0 ? fases[faseIndex] : null;
    const activaciones: Record<MuscleGroup, number> = { ...EMPTY_ACTIVATIONS };

    if (faseActiva) {
      const intensity = Math.min(1, Math.max(0, faseActiva.intensidad));
      for (const muscle of [...faseActiva.agonistas, ...faseActiva.sinergistas]) {
        activaciones[muscle] = Math.max(activaciones[muscle], intensity);
      }
      for (const muscle of faseActiva.antagonistas) {
        activaciones[muscle] = Math.max(activaciones[muscle], intensity * ANTAGONIST_FACTOR);
      }
    }

    return { faseActiva, faseIndex, activaciones };
  }, [fases, progress]);
}
