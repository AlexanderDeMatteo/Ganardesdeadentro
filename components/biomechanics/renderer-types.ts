import type { ExercisePhase, MuscleGroup } from '@/lib/api/contracts/biomechanics';

export interface MuscleRendererProps {
  activaciones: Record<MuscleGroup, number>;
  faseActiva: ExercisePhase | null;
  progress: number;
  className?: string;
}

export type RendererKind = 'map2d' | 'viewer3d';
