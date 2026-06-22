'use client';

import type { MembershipPlan } from '@/hooks/use-memberships';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

const TIER_LABELS: Record<MembershipPlan['functionalTier'], string> = {
  basic: 'Básico',
  premium: 'Premium',
  pro: 'Pro',
};

const SPOTLIGHT_SPRING = { stiffness: 90, damping: 24, mass: 0.35 };

type MembershipPlanCardV4Props = {
  plan: MembershipPlan;
  phase: string;
  featured?: boolean;
  href: string;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
}

export function MembershipPlanCardV4({
  plan,
  phase,
  featured = false,
  href,
}: MembershipPlanCardV4Props) {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, SPOTLIGHT_SPRING);
  const springY = useSpring(mouseY, SPOTLIGHT_SPRING);

  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${springX}px ${springY}px, rgb(104 202 98 / 0.22), transparent 68%)`;

  useEffect(() => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(rect.width * 0.5);
    mouseY.set(rect.height * 0.35);
  }, [reducedMotion, mouseX, mouseY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(rect.width * 0.5);
    mouseY.set(rect.height * 0.35);
  };

  const previewFeatures = plan.features.slice(0, 3);

  return (
    <motion.article
      whileHover={reducedMotion ? undefined : { y: -8 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="group h-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[color-mix(in_srgb,var(--landing-bg)_80%,transparent)] p-8 backdrop-blur-md transition-shadow duration-300',
          featured
            ? 'shadow-[var(--landing-glow)] ring-1 ring-[var(--landing-green)]/20'
            : 'bg-black/40 hover:border-white/10 hover:shadow-[var(--landing-glow)]',
        )}
      >
        {reducedMotion ? (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_circle_at_50%_35%,rgb(104_202_98_/_0.12),transparent_68%)]"
            aria-hidden
          />
        ) : (
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: spotlight }}
            aria-hidden
          />
        )}

        <div className="relative z-10 mb-8 flex items-start justify-between gap-4">
          <span className="font-mono text-sm font-bold tracking-[0.2em] text-[var(--landing-green-pastel)]/60">
            {phase}
          </span>
          {featured && (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--landing-green-pastel)] backdrop-blur-md">
              Recomendado
            </span>
          )}
        </div>

        <p className="relative z-10 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--landing-green-pastel)]">
          {TIER_LABELS[plan.functionalTier]} · {formatPrice(plan.price)} / {plan.durationDays} días
        </p>
        <h3 className="landing-heading relative z-10 mb-3 text-xl text-white sm:text-2xl">{plan.name}</h3>
        <p className="relative z-10 mb-5 text-sm leading-relaxed text-white/70">{plan.description}</p>

        <ul className="relative z-10 mb-6 flex-1 space-y-2">
          {previewFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs text-white/60">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--landing-green)]" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className="relative z-10 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[var(--landing-green)] transition-colors hover:text-[var(--landing-green-pastel)]"
        >
          Elegir plan
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </motion.article>
  );
}
