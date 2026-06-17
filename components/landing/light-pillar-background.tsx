'use client';

import { useEffect, useState } from 'react';
import LightPillar from '@/components/LightPillar/LightPillar';
import { cn } from '@/lib/utils';

const LANDING_GREEN = '#68ca62';
const LANDING_GREEN_DARK = '#255831';

type LightPillarBackgroundProps = {
  reducedMotion: boolean;
  className?: string;
};

function StaticPillarFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[var(--landing-bg)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(104_202_98_/_0.28),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgb(37_88_49_/_0.35),transparent_50%)]" />
    </div>
  );
}

export function LightPillarBackground({ reducedMotion, className }: LightPillarBackgroundProps) {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setQuality(media.matches ? 'low' : 'medium');
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (reducedMotion) {
    return <StaticPillarFallback className={className} />;
  }

  return (
    <div className={cn('pointer-events-none absolute inset-0 z-0', className)} aria-hidden>
      <div className="absolute inset-0 bg-[var(--landing-bg)]" />
      <LightPillar
        className="absolute inset-0"
        topColor={LANDING_GREEN}
        bottomColor={LANDING_GREEN_DARK}
        intensity={1.5}
        rotationSpeed={2}
        interactive={false}
        glowAmount={0.005}
        pillarWidth={3}
        pillarHeight={0.4}
        noiseIntensity={0.45}
        mixBlendMode="screen"
        pillarRotation={0}
        quality={quality}
      />
    </div>
  );
}
