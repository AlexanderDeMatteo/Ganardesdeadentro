'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export type ServiceCardAccent = 'primary' | 'secondary';

export type ServiceCardProps = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  accent: ServiceCardAccent;
  badge?: string;
  href: string;
};

export function ServiceCard({
  icon: Icon,
  title,
  subtitle,
  description,
  accent,
  badge,
  href,
}: ServiceCardProps) {
  const reducedMotion = useReducedMotion();
  const isPrimary = accent === 'primary';

  return (
    <motion.article
      whileHover={reducedMotion ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative flex flex-col border border-white/10 bg-[var(--landing-surface)] p-8 hover:border-[var(--landing-green)]/50 hover:shadow-[0_12px_40px_rgb(104_202_98_/_0.15)]"
    >
      {badge && (
        <span className="absolute right-4 top-4 bg-[var(--landing-green)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--landing-bg)]">
          {badge}
        </span>
      )}
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center border transition-transform group-hover:scale-110 ${
          isPrimary
            ? 'border-[var(--landing-green)]/50 text-[var(--landing-green)]'
            : 'border-[var(--landing-green-pastel)]/50 text-[var(--landing-green-pastel)]'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--landing-green-pastel)]">
        {subtitle}
      </p>
      <h3 className="landing-heading mb-3 text-xl text-white sm:text-2xl">{title}</h3>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-white/70">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--landing-green)] hover:underline"
      >
        Explorar plan
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </motion.article>
  );
}
