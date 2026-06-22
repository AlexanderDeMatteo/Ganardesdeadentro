'use client';

import { useState } from 'react';

import { useExerciseBiomechanics } from '@/hooks/use-exercise-biomechanics';
import { useBiomechanicsState } from '@/hooks/use-biomechanics-state';
import { MuscleMap2D } from '@/components/biomechanics/muscle-map-2d';
import { MuscleInfoPanel } from '@/components/biomechanics/muscle-info-panel';
import { TimelineControls } from '@/components/biomechanics/timeline-controls';
import type { RendererKind } from '@/components/biomechanics/renderer-types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ExerciseViewerProps {
  exerciseId: string;
  renderer?: RendererKind;
  className?: string;
  embedded?: boolean;
}

export function ExerciseViewer({
  exerciseId,
  renderer = 'map2d',
  className,
  embedded = false,
}: ExerciseViewerProps) {
  const { data, isLoading, error } = useExerciseBiomechanics(exerciseId);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { faseActiva, activaciones } = useBiomechanicsState(data?.fases, progress);

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-[1fr_320px]', className)}>
        <Skeleton className="h-[420px] rounded bg-[#19211d]/50" />
        <Skeleton className="h-[420px] rounded bg-[#19211d]/50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className={cn(
          'flex min-h-[200px] flex-col items-center justify-center border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 p-6 text-center',
          className,
        )}
      >
        <p className="text-sm text-[#ffb4ab]">No se pudo cargar el ejercicio</p>
        <p className="mt-1 text-xs text-[#8fa88a]">{error ?? 'Ejercicio no disponible'}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-4 md:grid-cols-[1fr_320px]',
        !embedded && 'rounded border border-[#68ca62]/15 bg-[#0d130f]/60 p-4',
        className,
      )}
    >
      <div className="flex min-h-[420px] flex-col">
        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded bg-gradient-to-b from-[#101712] to-[#0a0f0c]">
          {renderer === 'viewer3d' ? (
            <div className="p-8 text-center text-xs uppercase tracking-widest text-[#8fa88a]">
              Renderer 3D disponible en Fase 2
            </div>
          ) : (
            <MuscleMap2D
              activaciones={activaciones}
              faseActiva={faseActiva}
              progress={progress}
              className="h-[360px] w-full"
            />
          )}
        </div>

        <div className="mt-4">
          <TimelineControls
            progress={progress}
            onProgressChange={setProgress}
            isPlaying={isPlaying}
            onPlayingChange={setIsPlaying}
            fases={data.fases}
          />
        </div>
      </div>

      <MuscleInfoPanel ejercicio={data.ejercicio} faseActiva={faseActiva} />
    </div>
  );
}
