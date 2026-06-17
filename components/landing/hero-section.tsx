'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GridBackground } from '@/components/landing/aceternity/grid-background';
import { LuminousButton } from '@/components/landing/aceternity/luminous-button';
import { Spotlight } from '@/components/landing/aceternity/spotlight';
import { Vortex } from '@/components/ui/vortex';
import { CoachParallaxCard } from '@/components/landing/coach-parallax-card';
import { LightPillarBackground } from '@/components/landing/light-pillar-background';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { LANDING_MASCOT_V1, type LandingMascotConfig } from '@/lib/landing/mascot-config';
import type { LandingHeroBackground } from '@/lib/landing/landing-variant';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

type HeroSectionProps = {
  isAuthenticated: boolean;
  mascot?: LandingMascotConfig;
  heroBackground?: LandingHeroBackground;
};

function HeroInner({
  isAuthenticated,
  mascot,
  reducedMotion,
}: {
  isAuthenticated: boolean;
  mascot: LandingMascotConfig;
  reducedMotion: boolean;
}) {
  const motionProps = reducedMotion
    ? {}
    : {
        initial: 'hidden' as const,
        animate: 'visible' as const,
        variants: containerVariants,
      };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-8">
      <motion.div
        className="flex w-full max-w-xl flex-col items-center space-y-7 text-center lg:items-start lg:space-y-8 lg:text-left"
        {...motionProps}
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 lg:items-start">
          {mascot.showKickerLogo && (
            <Image
              src={mascot.kickerLogoSrc}
              alt="BE A GAINER LIFE"
              width={72}
              height={72}
              className="h-14 w-14 object-contain sm:h-16 sm:w-16"
            />
          )}
          <p className="brand-kicker">Proyecto Ganar desde Adentro</p>
        </motion.div>

        <motion.h1
          id="hero-heading"
          variants={itemVariants}
          className="landing-heading text-5xl leading-[0.92] text-white sm:text-6xl sm:leading-[0.9] lg:text-7xl xl:text-8xl"
        >
          <span className="landing-text-glow block text-[var(--landing-green)]">Domina</span>
          <span className="block text-white">tu realidad</span>
        </motion.h1>

        <motion.div
          variants={itemVariants}
          className="w-full max-w-xl border-l-2 border-[var(--landing-green-pastel)] pl-5 text-left sm:border-l-[3px] sm:pl-6"
        >
          <p className="text-[15px] font-medium leading-relaxed text-[var(--landing-green-pastel)] sm:text-lg sm:leading-relaxed">
            Ganar desde adentro es alinear hábitos, descanso y cabeza con lo que haces en el gimnasio. FitTrack te da
            rutinas claras y métricas honestas para que cada semana refuerce disciplina real, no solo motivación
            pasajera.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex w-full max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center sm:gap-5 lg:justify-start"
        >
          {!isAuthenticated ? (
            <>
              <Link href="/register" className="w-full sm:min-w-[220px]">
                <LuminousButton luminousVariant="primary" size="lg" className="w-full">
                  Únete a la élite
                </LuminousButton>
              </Link>
              <Link href="#rutinas" className="w-full sm:min-w-[220px]">
                <LuminousButton luminousVariant="ghost" size="lg" className="w-full">
                  Ver programas
                </LuminousButton>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="w-full sm:min-w-[220px]">
                <LuminousButton luminousVariant="primary" size="lg" className="w-full">
                  Ir al panel
                </LuminousButton>
              </Link>
              <Link href="#rutinas" className="w-full sm:min-w-[220px]">
                <LuminousButton luminousVariant="ghost" size="lg" className="w-full">
                  Ver programas
                </LuminousButton>
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
        animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.3, ease: 'easeOut' }}
        className="w-full"
      >
        <CoachParallaxCard mascot={mascot} />
      </motion.div>
    </div>
  );
}

export function HeroSection({
  isAuthenticated,
  mascot = LANDING_MASCOT_V1,
  heroBackground = 'spotlight',
}: HeroSectionProps) {
  const reducedMotion = useReducedMotion();
  const [particleCount, setParticleCount] = useState(200);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setParticleCount(media.matches ? 100 : 200);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (heroBackground === 'vortex') {
    return (
      <section className="relative min-h-screen overflow-hidden" aria-labelledby="hero-heading">
        <Vortex
          backgroundColor="#black"
          rangeY={800}
          particleCount={particleCount}
          baseHue={120}
          baseSpeed={0.02}
          rangeSpeed={1.2}
          containerClassName="min-h-screen"
          className="relative flex min-h-screen w-full flex-col"
        >
          <HeroInner isAuthenticated={isAuthenticated} mascot={mascot} reducedMotion={reducedMotion} />
        </Vortex>
      </section>
    );
  }

  if (heroBackground === 'lightPillar') {
    return (
      <section
        className="relative min-h-screen overflow-hidden bg-[var(--landing-bg)]"
        aria-labelledby="hero-heading"
      >
        <GridBackground className="z-0 opacity-35" />
        <LightPillarBackground reducedMotion={reducedMotion} />
        <div className="relative z-10 min-h-screen">
          <HeroInner isAuthenticated={isAuthenticated} mascot={mascot} reducedMotion={reducedMotion} />
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-[var(--landing-bg)]"
      aria-labelledby="hero-heading"
    >
      <GridBackground />

      <Spotlight className="relative min-h-screen">
        <HeroInner isAuthenticated={isAuthenticated} mascot={mascot} reducedMotion={reducedMotion} />
      </Spotlight>
    </section>
  );
}
