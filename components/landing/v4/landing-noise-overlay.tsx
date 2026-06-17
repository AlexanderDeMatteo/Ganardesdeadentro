'use client';

import Noise from '@/components/Noise/Noise';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function LandingNoiseOverlay() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] opacity-[0.04]" aria-hidden>
      <Noise patternAlpha={12} patternRefreshInterval={3} />
    </div>
  );
}
