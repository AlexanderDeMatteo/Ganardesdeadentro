'use client';

import { LuminousButton } from '@/components/landing/aceternity/luminous-button';
import LaserFlow from '@/components/LaserFlow/LaserFlow';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion } from 'framer-motion';
import Link from 'next/link';

const LASER_REVEAL = { duration: 1.1, ease: 'easeOut' as const };
const CONTENT_REVEAL = { duration: 0.7, delay: 0.9, ease: 'easeOut' as const };

export function LandingCtaV4() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  return (
    <section className="relative min-h-[640px] w-full scroll-mt-24 overflow-hidden bg-black">
      {!reducedMotion && (
        /* Height fija en CSS — Three.js necesita dimensiones estables al montar */
        <motion.div
          className="pointer-events-none absolute top-0 left-0 right-0 z-0 h-[500px] overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={LASER_REVEAL}
        >
          <LaserFlow
            color="#255831"
            flowSpeed={0.45}
            wispIntensity={isMobile ? 10 : 28}
            wispDensity={isMobile ? 0.7 : 1.1}
            fogIntensity={isMobile ? 0.35 : 0.55}
            fogScale={0.28}
            verticalSizing={isMobile ? 2.8 : 3.5}
            horizontalBeamOffset={0}
            verticalBeamOffset={0.38}
            horizontalSizing={0.28}
            flowStrength={0.3}
            decay={1.2}
            className="h-full w-full mix-blend-screen"
          />
        </motion.div>
      )}

      {/* Glow radial en el punto de impacto del láser */}
      <div
        className="pointer-events-none absolute left-1/2 top-[390px] z-[1] h-32 w-[min(100%,36rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(37,88,49,0.4)_0%,transparent_70%)]"
        aria-hidden
      />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        whileInView={reducedMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
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
              className="h-auto w-full px-8 py-4 text-sm shadow-[0_0_20px_rgba(104,202,98,0.3)] sm:text-base"
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
