'use client';

import { LuminousButton } from '@/components/landing/aceternity/luminous-button';
import LaserFlow from '@/components/LaserFlow/LaserFlow';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion } from 'framer-motion';
import Link from 'next/link';

const LASER_REVEAL = { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const };
const CONTENT_REVEAL = { duration: 0.8, delay: 0.85, ease: 'easeOut' as const };

export function LandingCtaV4() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  return (
    <section className="relative min-h-[760px] w-full scroll-mt-24 overflow-hidden bg-black">
      {!reducedMotion && (
        <motion.div
          className="pointer-events-none absolute top-0 left-0 right-0 z-0 h-[760px] overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={LASER_REVEAL}
        >
          <LaserFlow
            color="#3a8c4a"
            flowSpeed={0.35}
            wispIntensity={isMobile ? 6 : 12}
            wispDensity={isMobile ? 0.8 : 1.0}
            wispSpeed={15}
            fogIntensity={isMobile ? 0.45 : 0.6}
            fogScale={0.3}
            fogFallSpeed={0.6}
            verticalSizing={isMobile ? 2.5 : 4.5}
            horizontalBeamOffset={0}
            verticalBeamOffset={0}
            horizontalSizing={0.3}
            flowStrength={0.25}
            decay={1.1}
            falloffStart={1.2}
            className="h-full w-full mix-blend-screen"
          />
        </motion.div>
      )}

      {/* Glow de impacto — halo verde difuso bajo el punto de aterrizaje */}
      <div
        className="pointer-events-none absolute left-1/2 top-[360px] z-[1] h-44 w-[min(100%,46rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(58,140,74,0.34)_0%,rgba(37,88,49,0.18)_45%,transparent_72%)]"
        aria-hidden
      />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={reducedMotion ? undefined : CONTENT_REVEAL}
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-24 pt-[400px] text-center sm:px-6 lg:px-8 lg:pb-32"
      >
        <h2 className="landing-heading bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-5xl font-black text-transparent md:text-7xl">
          ¿Listo para el siguiente nivel?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          Regístrate gratis y lleva tu entrenamiento al mismo sistema que usan quienes no negocian sus objetivos.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register" className="w-full sm:w-auto">
            <LuminousButton
              luminousVariant="primary"
              size="lg"
              className="h-auto w-full px-8 py-4 text-sm shadow-[0_0_28px_rgba(37,88,49,0.35)] sm:text-base"
            >
              Únete al sistema
            </LuminousButton>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <LuminousButton
              luminousVariant="ghost"
              size="lg"
              className="h-auto w-full px-8 py-4 transition-colors hover:text-white"
            >
              Ya tengo cuenta
            </LuminousButton>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
