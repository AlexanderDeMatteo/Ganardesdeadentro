'use client';

import { cn } from '@/lib/utils';

type ExerciseAnimationPlayerProps = {
  animationUrl?: string;
  animationType?: 'gif' | 'video' | 'none';
  name: string;
  className?: string;
  compact?: boolean;
};

export function ExerciseAnimationPlayer({
  animationUrl,
  animationType,
  name,
  className,
  compact = false,
}: ExerciseAnimationPlayerProps) {
  if (!animationUrl || animationType === 'none') {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-dashed gp-border gp-bg-surface-high gp-text-muted',
          compact ? 'h-24 text-xs' : 'h-40 text-sm',
          className,
        )}
      >
        Sin animación disponible
      </div>
    );
  }

  if (animationType === 'video') {
    return (
      <video
        className={cn(
          'w-full rounded-lg border gp-border object-contain gp-bg-surface-high',
          compact ? 'max-h-32' : 'max-h-56',
          className,
        )}
        src={animationUrl}
        autoPlay
        loop
        muted
        playsInline
        aria-label={`Video demostrativo de ${name}`}
      />
    );
  }

  return (
    <img
      className={cn(
        'w-full rounded-lg border gp-border object-contain gp-bg-surface-high',
        compact ? 'max-h-32' : 'max-h-56',
        className,
      )}
      src={animationUrl}
      alt={`Animación de ${name}`}
      loading="lazy"
    />
  );
}
