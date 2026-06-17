'use client';

import { ProgramCardV4 } from '@/components/landing/v4/program-card-v4';
import { LandingSection } from '@/components/landing/v4/landing-section';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion } from 'framer-motion';

const PROGRAMS = [
  {
    id: 'hypertrophy',
    phase: '[ 01 ]',
    title: 'Núcleo de hipertrofia',
    subtitle: 'Volumen progresivo · 8–12 semanas',
    description:
      'Volumen inteligente, técnica impecable y progresión semana a semana para construir masa real.',
    badge: 'Nuevo',
    featured: true,
  },
  {
    id: 'metabolic',
    phase: '[ 02 ]',
    title: 'Acondicionamiento metabólico',
    subtitle: 'Alta densidad · 4–6 semanas',
    description:
      'Sesiones de alta densidad para quemar grasa sin perder fuerza ni rendimiento en el gimnasio.',
  },
  {
    id: 'performance',
    phase: '[ 03 ]',
    title: 'Entrenamientos Rápidos',
    subtitle: '15–60 min · Flexibilidad total',
    description: 'Sesiones de 15 a 60 minutos adaptadas a tu disponibilidad y nivel actual.',
  },
] as const;

const GRID_VARIANTS = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 24,
    },
  },
};

type LandingProgramsV4Props = {
  isAuthenticated: boolean;
};

export function LandingProgramsV4({ isAuthenticated }: LandingProgramsV4Props) {
  const reducedMotion = useReducedMotion();
  const href = isAuthenticated ? '/routines' : '/register';

  return (
    <LandingSection id="rutinas" glow="top" divider aria-labelledby="programs-heading-v4">
      <header className="mx-auto mb-16 max-w-3xl text-center">
        {reducedMotion ? (
          <>
            <p className="text-lg font-black uppercase tracking-widest text-[var(--landing-green-pastel)] sm:text-xl">
              Planes diseñados para resultados medibles, no modas pasajeras.
            </p>
            <h2
              id="programs-heading-v4"
              className="landing-heading mt-8 text-4xl text-[var(--landing-green)] lg:text-6xl"
            >
              Transforma tu cuerpo
            </h2>
          </>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className="text-lg font-black uppercase tracking-widest text-[var(--landing-green-pastel)] sm:text-xl"
            >
              Planes diseñados para resultados medibles, no modas pasajeras.
            </motion.p>
            <motion.h2
              id="programs-heading-v4"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.08 }}
              className="landing-heading mt-8 text-4xl text-[var(--landing-green)] lg:text-6xl"
            >
              Transforma tu cuerpo
            </motion.h2>
          </>
        )}
      </header>

      {reducedMotion ? (
        <div className="grid gap-6 md:grid-cols-3">
          {PROGRAMS.map((plan) => (
            <ProgramCardV4 key={plan.id} {...plan} href={href} />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={GRID_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {PROGRAMS.map((plan) => (
            <motion.div key={plan.id} variants={CARD_VARIANTS} className="h-full">
              <ProgramCardV4 {...plan} href={href} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </LandingSection>
  );
}
