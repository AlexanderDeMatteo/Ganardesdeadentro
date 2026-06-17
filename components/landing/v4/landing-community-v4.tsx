'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CONTENT_VARIANTS = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

const TITLE_VARIANTS = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 26,
    },
  },
};

const PARAGRAPH_VARIANTS = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 220,
      damping: 28,
    },
  },
};

const BUTTON_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 240,
      damping: 24,
    },
  },
};

type CommunityKineticButtonProps = {
  href: string;
  children: React.ReactNode;
  reducedMotion: boolean;
};

function CommunityKineticButton({ href, children, reducedMotion }: CommunityKineticButtonProps) {
  if (reducedMotion) {
    return (
      <Link
        href={href}
        className="inline-flex rounded-full border border-[var(--landing-green)]/40 bg-black/50 px-10 py-4 text-sm font-black uppercase tracking-[0.18em] text-[var(--landing-green-pastel)] backdrop-blur-md"
      >
        {children}
      </Link>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
      <Link href={href} className="inline-block">
        <motion.span
          className="inline-flex rounded-full border border-[var(--landing-green)]/40 bg-black/50 px-10 py-4 text-sm font-black uppercase tracking-[0.18em] text-[var(--landing-green-pastel)] backdrop-blur-md transition-colors duration-300"
          whileHover={{
            boxShadow: '0 0 36px rgb(104 202 98 / 0.45)',
            borderColor: 'rgb(104 202 98 / 0.8)',
            color: 'rgb(206 222 185)',
            textShadow: '0 0 14px rgb(206 222 185 / 0.55)',
          }}
          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        >
          {children}
        </motion.span>
      </Link>
    </motion.div>
  );
}

type LandingCommunityV4Props = {
  isAuthenticated: boolean;
};

export function LandingCommunityV4({ isAuthenticated }: LandingCommunityV4Props) {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="comunidad"
      className="relative w-full scroll-mt-24 overflow-hidden"
      aria-labelledby="community-heading-v4"
    >
      <div className="relative min-h-[480px] w-full overflow-hidden lg:min-h-[560px]">
        {!reducedMotion && (
          <video
            src="/videos/comunidad.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 z-0 h-full w-full object-cover opacity-50"
            aria-hidden
          />
        )}

        {reducedMotion && (
          <div
            className="absolute inset-0 z-0 bg-[color-mix(in_srgb,var(--landing-bg)_88%,black)]"
            aria-hidden
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(18,26,22,0.4)_0%,rgba(10,15,12,0.9)_100%)]" />

        <div className="relative z-10 flex min-h-[480px] items-center justify-center px-4 py-24 sm:px-6 lg:min-h-[560px] lg:px-8 lg:py-28">
          {reducedMotion ? (
            <div className="mx-auto max-w-4xl text-center">
              <h2
                id="community-heading-v4"
                className="landing-heading text-5xl font-black text-white/90 lg:text-7xl"
              >
                Comunidad que entrena en serio
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--landing-green-pastel)] sm:text-lg">
                Comparte avances, retos y técnica con personas que ya eligieron el camino difícil. La élite no es un
                cartel: es constancia compartida.
              </p>
              {!isAuthenticated && (
                <div className="mt-10">
                  <CommunityKineticButton href="/register" reducedMotion>
                    Crear cuenta
                  </CommunityKineticButton>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              className="mx-auto max-w-4xl text-center"
              variants={CONTENT_VARIANTS}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
            >
              <motion.h2
                id="community-heading-v4"
                variants={TITLE_VARIANTS}
                className="landing-heading text-5xl font-black text-white/90 lg:text-7xl"
              >
                Comunidad que entrena en serio
              </motion.h2>
              <motion.p
                variants={PARAGRAPH_VARIANTS}
                className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--landing-green-pastel)] sm:text-lg"
              >
                Comparte avances, retos y técnica con personas que ya eligieron el camino difícil. La élite no es un
                cartel: es constancia compartida.
              </motion.p>
              {!isAuthenticated && (
                <motion.div variants={BUTTON_VARIANTS} className="mt-10">
                  <CommunityKineticButton href="/register" reducedMotion={false}>
                    Crear cuenta
                  </CommunityKineticButton>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
