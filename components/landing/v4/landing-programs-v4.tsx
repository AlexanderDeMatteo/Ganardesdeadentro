'use client';

import { MembershipPlanCardV4 } from '@/components/landing/v4/membership-plan-card-v4';
import { LandingSection } from '@/components/landing/v4/landing-section';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicMembershipPlans } from '@/hooks/use-public-membership-plans';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion } from 'framer-motion';

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
  const { plans, isLoading, error } = usePublicMembershipPlans();
  const href = isAuthenticated ? '/memberships' : '/register';

  const header = (
    <>
      <p className="text-lg font-black uppercase tracking-widest text-[var(--landing-green-pastel)] sm:text-xl">
        Membresías diseñadas para resultados medibles, no modas pasajeras.
      </p>
      <h2
        id="memberships-heading-v4"
        className="landing-heading mt-8 text-4xl text-[var(--landing-green)] lg:text-6xl"
      >
        Elige tu nivel
      </h2>
    </>
  );

  const renderPlans = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[380px] rounded-2xl bg-white/5" />
          ))}
        </div>
      );
    }

    if (error || plans.length === 0) {
      return (
        <p className="text-center text-sm text-white/60" role="status">
          {error ?? 'No hay membresías disponibles en este momento.'}
        </p>
      );
    }

    if (reducedMotion) {
      return (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <MembershipPlanCardV4
              key={plan.id}
              plan={plan}
              phase={`[ ${String(index + 1).padStart(2, '0')} ]`}
              featured={plan.functionalTier === 'premium'}
              href={href}
            />
          ))}
        </div>
      );
    }

    return (
      <motion.div
        className="grid gap-6 md:grid-cols-3"
        variants={GRID_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {plans.map((plan, index) => (
          <motion.div key={plan.id} variants={CARD_VARIANTS} className="h-full">
            <MembershipPlanCardV4
              plan={plan}
              phase={`[ ${String(index + 1).padStart(2, '0')} ]`}
              featured={plan.functionalTier === 'premium'}
              href={href}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <LandingSection id="membresias" glow="top" divider aria-labelledby="memberships-heading-v4">
      <header className="mx-auto mb-16 max-w-3xl text-center">
        {reducedMotion ? (
          header
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className="text-lg font-black uppercase tracking-widest text-[var(--landing-green-pastel)] sm:text-xl"
            >
              Membresías diseñadas para resultados medibles, no modas pasajeras.
            </motion.p>
            <motion.h2
              id="memberships-heading-v4"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.08 }}
              className="landing-heading mt-8 text-4xl text-[var(--landing-green)] lg:text-6xl"
            >
              Elige tu nivel
            </motion.h2>
          </>
        )}
      </header>

      {renderPlans()}
    </LandingSection>
  );
}
