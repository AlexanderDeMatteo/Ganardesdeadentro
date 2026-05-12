import type { CoachMood } from '@/hooks/use-coach-tips';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CoachAvatarProps {
  mood: CoachMood;
  className?: string;
  /** Cuando el avatar está visible arriba del pliegue (coach expandido), prioriza la carga para LCP. */
  priority?: boolean;
}

/** Imagen decorativa del entrenador; el texto accesible vive en `CoachMascot`. */
export function CoachAvatar({ mood, className, priority = false }: CoachAvatarProps) {
  return (
    <div
      className={cn('coach-avatar', `coach-avatar--${mood}`, className)}
      aria-hidden="true"
    >
      <Image
        className="coach-avatar__provided"
        src="/coach-trainer.png"
        alt=""
        width={640}
        height={800}
        sizes="(max-width: 639px) min(38vw, 132px), (max-width: 899px) 140px, 152px"
        unoptimized
        decoding={priority ? 'sync' : 'async'}
        priority={priority}
        fetchPriority={priority ? 'high' : 'low'}
      />
    </div>
  );
}
