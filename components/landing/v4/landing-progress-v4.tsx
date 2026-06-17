'use client';

import { LandingFade, LandingScrollTitle } from '@/components/landing/v4/landing-motion';
import { LandingGlassPanel } from '@/components/landing/v4/landing-glass-panel';
import { LandingSection } from '@/components/landing/v4/landing-section';
import type { LandingMascotConfig } from '@/lib/landing/mascot-config';
import { Quote } from 'lucide-react';
import Image from 'next/image';

type LandingProgressV4Props = {
  mascot: LandingMascotConfig;
};

export function LandingProgressV4({ mascot }: LandingProgressV4Props) {
  return (
    <LandingSection id="progreso" glow="center" divider className="border-y border-[var(--landing-green-dark)]/20">
      <LandingScrollTitle title="Resultados ganadores" className="mb-12" />
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <LandingFade className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="relative aspect-[3/4] overflow-hidden border border-white/10 bg-muted">
            <Image
              src="/placeholder-user.jpg"
              alt="Miembro antes del programa"
              fill
              className="object-cover grayscale"
              sizes="(max-width: 1024px) 45vw, 400px"
            />
            <div className="absolute inset-0 bg-[var(--landing-bg)]/30" aria-hidden />
          </div>
          <div
            className={`relative overflow-hidden border-2 border-[var(--landing-green)] bg-muted shadow-[var(--landing-glow-strong)] ring-1 ring-[var(--landing-green)]/30 ${mascot.progressAspect}`}
          >
            <Image
              src={mascot.src}
              alt={mascot.alt}
              fill
              className={mascot.progressImageClassName}
              sizes="(max-width: 1024px) 45vw, 400px"
            />
          </div>
        </LandingFade>

        <LandingFade delay={150}>
          <LandingGlassPanel className="relative space-y-6 border-l-2 border-[var(--landing-green-pastel)]">
            <Quote className="h-12 w-12 text-[var(--landing-green)] opacity-90" aria-hidden />
            <blockquote className="text-lg italic leading-relaxed text-white/90 sm:text-xl">
              Pasé de entrenar a ciegas a tener números claros cada semana. La constancia dejó de ser teoría: ahora es
              un hábito con nombre.
            </blockquote>
            <footer>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[var(--landing-green-pastel)]">
                Marcus K.
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                Miembro élite · 6 meses
              </p>
            </footer>
          </LandingGlassPanel>
        </LandingFade>
      </div>
    </LandingSection>
  );
}
