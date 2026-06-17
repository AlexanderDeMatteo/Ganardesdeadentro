'use client';

import { CoachTitanVisualV4 } from '@/components/landing/v4/coach-titan-visual-v4';
import { LandingFade } from '@/components/landing/v4/landing-motion';
import { LandingGlassPanel } from '@/components/landing/v4/landing-glass-panel';
import { LandingSection } from '@/components/landing/v4/landing-section';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function LandingCoachV4() {
  const reducedMotion = useReducedMotion();

  return (
    <LandingSection glow="bottom" divider className="overflow-visible" aria-labelledby="coach-heading-v4">
      <div className="grid items-stretch gap-12 overflow-visible lg:grid-cols-2 lg:items-end lg:gap-4">
        <LandingFade className="relative order-1 z-20 lg:translate-x-16 lg:order-none xl:translate-x-20">
          <CoachTitanVisualV4 />
        </LandingFade>

        <LandingFade delay={120} className="relative order-2 space-y-8 lg:order-none lg:z-0">
          <div className="space-y-3">
            <h2 id="coach-heading-v4" className="landing-heading text-4xl sm:text-5xl">
              <span className="text-white">El </span>
              <span className="text-[var(--landing-green)]">Titan</span>
            </h2>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--landing-green-pastel)]">
              Tu coach de élite
            </p>
            <span className="inline-flex items-center rounded-full border border-[var(--landing-green)]/30 bg-[var(--landing-surface)]/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--landing-green-pastel)]">
              Sistema Rise · Mentoría
            </span>
          </div>

          <LandingGlassPanel className="relative space-y-8">
            <p className="text-base leading-relaxed text-white/80 sm:text-lg">
              Creo en el trabajo duro con método: progresión, recuperación y mentalidad de atleta. No vendemos atajos;
              construimos disciplina que sobrevive a los imprevistos del día a día.
            </p>
            <p className="text-base leading-relaxed text-white/80 sm:text-lg">
              Cada plan en FitTrack nace de la idea de ganar desde adentro: datos accionables, rutinas que puedes
              sostener y un estándar claro de excelencia.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: '10+', label: 'Años de experiencia' },
                { value: '5K+', label: 'Vidas transformadas' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={reducedMotion ? undefined : { y: -4 }}
                  className="landing-v4-card border-l-4 border-l-[var(--landing-green-pastel)] p-5"
                >
                  <p className="landing-heading text-3xl text-white">{stat.value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/55">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </LandingGlassPanel>
        </LandingFade>
      </div>
    </LandingSection>
  );
}
