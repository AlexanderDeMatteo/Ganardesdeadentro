'use client';

import { Dumbbell, Flame, Zap } from 'lucide-react';
import { LandingProgramsGrid, type ProgramItem } from '@/components/landing/landing-programs-grid';

const PROGRAMS: ProgramItem[] = [
  {
    id: 'hypertrophy',
    icon: Dumbbell,
    title: 'Núcleo de hipertrofia',
    subtitle: 'Volumen progresivo · 8–12 semanas',
    description:
      'Volumen inteligente, técnica impecable y progresión semana a semana para construir masa real.',
    accent: 'primary',
    badge: 'Nuevo',
  },
  {
    id: 'metabolic',
    icon: Flame,
    title: 'Acondicionamiento metabólico',
    subtitle: 'Alta densidad · 4–6 semanas',
    description:
      'Sesiones de alta densidad para quemar grasa sin perder fuerza ni rendimiento en el gimnasio.',
    accent: 'secondary',
  },
  {
    id: 'performance',
    icon: Zap,
    title: 'Entrenamientos Rápidos',
    subtitle: '15–60 min · Flexibilidad total',
    description: 'Sesiones de 15 a 60 minutos adaptadas a tu disponibilidad y nivel actual.',
    accent: 'primary',
  },
];

type LandingProgramsProps = {
  isAuthenticated: boolean;
};

export function LandingPrograms({ isAuthenticated }: LandingProgramsProps) {
  const href = isAuthenticated ? '/routines' : '/register';

  return (
    <section id="rutinas" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="programs-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl space-y-3">
          <h2 id="programs-heading" className="landing-heading text-4xl text-[var(--landing-green)] sm:text-5xl">
            Transforma tu cuerpo
          </h2>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--landing-green-pastel)]/70">
            Planes diseñados para resultados medibles, no modas pasajeras.
          </p>
        </div>
        <LandingProgramsGrid programs={PROGRAMS} href={href} />
      </div>
    </section>
  );
}
