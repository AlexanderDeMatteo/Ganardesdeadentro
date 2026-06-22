'use client';

import { useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

import type { ExercisePhase } from '@/lib/api/contracts/biomechanics';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

const CYCLE_DURATION_MS = 4500;

interface TimelineControlsProps {
  progress: number;
  onProgressChange: (value: number) => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  fases: ExercisePhase[];
}

export function TimelineControls({
  progress,
  onProgressChange,
  isPlaying,
  onPlayingChange,
  fases,
}: TimelineControlsProps) {
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!isPlaying) return;

    let frameId: number;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      const next = progressRef.current + (delta / CYCLE_DURATION_MS) * 100;
      onProgressChange(next >= 100 ? next - 100 : next);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, onProgressChange]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Slider
          value={[progress]}
          min={0}
          max={100}
          step={0.5}
          onValueChange={(values) => {
            if (isPlaying) onPlayingChange(false);
            onProgressChange(values[0]);
          }}
          aria-label="Progreso del movimiento"
        />
        <div className="pointer-events-none absolute inset-x-0 top-4 h-3">
          {fases.slice(1).map((fase) => (
            <span
              key={fase.nombre}
              className="absolute h-2 w-px bg-[#68ca62]/60"
              style={{ left: `${fase.rango[0]}%` }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-[#68ca62]/40 bg-transparent text-[#68ca62] hover:bg-[#68ca62]/10"
          onClick={() => onPlayingChange(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          <span className="ml-1 text-xs uppercase">{isPlaying ? 'Pausar' : 'Play'}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-[#8fa88a] hover:text-[#dce5de]"
          onClick={() => {
            onPlayingChange(false);
            onProgressChange(0);
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          <span className="ml-1 text-xs uppercase">Reiniciar</span>
        </Button>
        <span className="ml-auto text-xs tabular-nums text-[#8fa88a]">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
