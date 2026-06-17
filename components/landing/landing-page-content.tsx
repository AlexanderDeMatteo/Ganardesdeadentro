'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/context/auth-context';
import { HeroSection } from '@/components/landing/hero-section';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingPrograms } from '@/components/landing/landing-programs';
import { LandingNoiseOverlay } from '@/components/landing/v4/landing-noise-overlay';
import { LandingPageBodyV4 } from '@/components/landing/v4/landing-page-body-v4';
import { Button } from '@/components/ui/button';
import { LandingCtaV4 } from '@/components/landing/v4/landing-cta-v4';
import type { LandingVariantConfig } from '@/lib/landing/landing-variant';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';

type LandingPageContentProps = {
  faqItems?: Array<{ question: string; answer: string }>;
  variant: LandingVariantConfig;
};

export function LandingPageContent({ faqItems = [], variant }: LandingPageContentProps) {
  const { isAuthenticated } = useAuth();
  const { mascot } = variant;
  const isV4 = variant.id === 'v4';

  return (
    <div className={cn('landing-root bg-black text-white', isV4 && 'landing-v4')}>
      {isV4 && <LandingNoiseOverlay />}
      <LandingNavbar premium={isV4} />
      
      <main id="main-content" className="min-h-screen">
        <HeroSection
          isAuthenticated={isAuthenticated}
          mascot={variant.mascot}
          heroBackground={variant.heroBackground}
        />

        {isV4 ? (
          <LandingPageBodyV4 isAuthenticated={isAuthenticated} faqItems={faqItems} />
        ) : (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            
            <LandingPrograms isAuthenticated={isAuthenticated} />

            {/* Sección Resultados */}
            <section id="progreso" className="relative border-y border-white/5 bg-black/40 py-24">
              <div className="mx-auto max-w-6xl px-6">
                <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="landing-heading mb-16 text-center text-4xl text-[var(--landing-green)] sm:text-6xl">
                  Resultados ganadores
                </motion.h2>
                <div className="grid items-center gap-16 lg:grid-cols-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative aspect-[3/4] overflow-hidden border border-white/10 bg-zinc-900">
                      <Image src="/placeholder-user.jpg" alt="Antes" fill className="object-cover grayscale" />
                    </div>
                    <div className={`relative overflow-hidden border-2 border-[var(--landing-green)] ${mascot.progressAspect}`}>
                      <Image src={mascot.src} alt={mascot.alt} fill className={mascot.progressImageClassName} />
                    </div>
                  </div>
                  <div className="relative space-y-6">
                    <Quote className="h-12 w-12 text-[var(--landing-green)] opacity-50" />
                    <blockquote className="text-xl italic leading-relaxed text-zinc-300">
                      "Pasé de entrenar a ciegas a tener números claros. La constancia dejó de ser teoría: ahora es hábito."
                    </blockquote>
                    <footer>
                      <p className="font-black uppercase tracking-[0.2em] text-[var(--landing-green-pastel)]">Marcus K.</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Miembro élite · 6 meses</p>
                    </footer>
                  </div>
                </div>
              </div>
            </section>

            {/* Sección Coach */}
            <section className="py-24" aria-labelledby="coach-heading">
              <div className="mx-auto max-w-6xl px-6">
                <div className="grid items-start gap-16 lg:grid-cols-2">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} className="relative">
                    <div className={`relative border border-white/10 p-2 shadow-2xl ${mascot.coachContainerClassName}`}>
                       <Image src={mascot.src} alt={mascot.alt} width={500} height={500} className="grayscale" />
                       <span className="absolute bottom-6 right-6 bg-[var(--landing-green)] px-4 py-1 text-xs font-black uppercase text-black">Entrenador líder</span>
                    </div>
                  </motion.div>
                  <div className="space-y-8">
                    <h2 id="coach-heading" className="landing-heading text-5xl">Gilmer <span className="text-[var(--landing-green)]">Hernández</span></h2>
                    <p className="text-lg leading-relaxed text-zinc-400">Creo en el trabajo duro con método: progresión, recuperación y mentalidad de atleta. No vendemos atajos.</p>
                    <div className="flex gap-12 border-t border-white/10 pt-8">
                      <div><p className="text-4xl font-black text-white">10+</p><p className="text-xs uppercase tracking-widest text-zinc-500">Años exp.</p></div>
                      <div><p className="text-4xl font-black text-white">5K+</p><p className="text-xs uppercase tracking-widest text-zinc-500">Vidas</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Sección Comunidad (Video Fondo) */}
            <section className="relative h-[60vh] overflow-hidden">
              <video src="/videos/comunidad.mp4" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-40" />
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 px-6 text-center backdrop-blur-sm">
                <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} className="landing-heading text-5xl text-white">Comunidad que entrena en serio</motion.h2>
                {!isAuthenticated && (
                   <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                     <Link href="/register" className="mt-8 inline-block rounded-full bg-[var(--landing-green)] px-10 py-4 font-black uppercase text-black hover:scale-105 transition-transform">Crear cuenta</Link>
                   </motion.div>
                )}
              </div>
            </section>

            {/* Preguntas Frecuentes (Glassmorphism) */}
            <section className="py-24 bg-zinc-950/30">
              <div className="mx-auto max-w-3xl px-6">
                <h2 className="mb-12 text-center text-4xl font-black uppercase tracking-widest">Preguntas frecuentes</h2>
                <div className="space-y-4">
                  {faqItems.map((item, i) => (
                    <motion.article key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="border border-white/5 bg-white/[0.02] p-6 hover:border-[var(--landing-green)]/30 transition-colors">
                      <h3 className="font-bold text-[var(--landing-green)]">{item.question}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{item.answer}</p>
                    </motion.article>
                  ))}
                </div>
              </div>
            </section>
            {/* Sección Final (Laser Flow + CTA) */}
            {!isAuthenticated && <LandingCtaV4 />}

            {/* Footer aquí... */}
          </motion.div>
        )}
      </main>
    </div>
  );
}