'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/context/auth-context';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Dumbbell, Flame, Quote, Zap } from 'lucide-react';

const programs = [
  {
    id: 'hypertrophy',
    icon: Dumbbell,
    title: 'Núcleo de hipertrofia',
    description: 'Volumen inteligente, técnica impecable y progresión semana a semana para construir masa real.',
    accent: 'lime' as const,
    badge: 'Nuevo' as const,
  },
  {
    id: 'metabolic',
    icon: Flame,
    title: 'Acondicionamiento metabólico',
    description: 'Sesiones de alta densidad para quemar grasa sin perder fuerza ni rendimiento en el gimnasio.',
    accent: 'cyan' as const,
  },
  {
    id: 'performance',
    icon: Zap,
    title: 'Entrenamientos Rápidos',
    description: 'Sesiones de 15 a 60 minutos adaptadas a tu disponibilidad',
    color: 'from-purple-500 to-indigo-500',
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen bg-[var(--brand-ink)] text-foreground">
        {/* Hero — public/pesas.png: B/N, desenfoque suave y sombreado (fondo legible) */}
        <section className="relative min-h-[92vh] overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="relative h-full w-full">
              <Image
                src="/pesas.png"
                alt="Gimnasio con equipamiento de fuerza"
                fill
                priority
                className=" object-cover grayscale blur-[2.5px] brightness-[0.68] contrast-[1.08]"
                sizes="100vw"
              />
            </div>
            <div className="absolute inset-0 bg-[var(--brand-ink)]/25" aria-hidden />
          </div>

          <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center px-4 pb-16 pt-24 text-center sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
            <div className="flex w-full max-w-3xl flex-col items-center space-y-7 sm:space-y-9 lg:space-y-10">
              <p className="brand-kicker text-[var(--brand-cyan)] [text-shadow:0_2px_14px_rgba(0,0,0,0.85)]">
                Proyecto Ganar desde Adentro
              </p>

              <h1 className="landing-heading text-5xl leading-[0.92] text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.75)] sm:text-6xl sm:leading-[0.9] lg:text-7xl xl:text-8xl">
                <span className="block text-[var(--brand-lime)]">Domina</span>
                <span className="block text-white">tu realidad</span>
              </h1>

              <div className="w-full max-w-xl border-l-2 border-[var(--brand-cyan)] pl-5 text-left sm:border-l-[3px] sm:pl-6">
                <p className="text-[15px] font-medium leading-relaxed text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] sm:text-lg sm:leading-relaxed">
                  Ganar desde adentro es alinear hábitos, descanso y cabeza con lo que haces en el gimnasio. FitTrack te
                  da rutinas claras y métricas honestas para que cada semana refuerce disciplina real, no solo
                  motivación pasajera.
                </p>
              </div>

              <div className="flex w-full max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center sm:gap-5">
                {!isAuthenticated ? (
                  <>
                    <Link href="/register" className="w-full sm:w-auto sm:min-w-[220px]">
                      <Button
                        size="lg"
                        className="h-12 w-full rounded-none border-2 border-[var(--brand-cyan)] bg-[var(--brand-lime)] px-8 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-ink)] shadow-none hover:bg-[color-mix(in_srgb,var(--brand-lime)_92%,white)] sm:text-sm"
                      >
                        Únete a la élite
                      </Button>
                    </Link>
                    <Link href="/#rutinas" className="w-full sm:w-auto sm:min-w-[220px]">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 w-full rounded-none border-2 border-[var(--brand-cyan)] bg-transparent px-8 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-cyan)] shadow-none hover:bg-[var(--brand-cyan)]/10 sm:text-sm"
                      >
                        Ver programas
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" className="w-full sm:w-auto sm:min-w-[220px]">
                      <Button
                        size="lg"
                        className="h-12 w-full rounded-none border-2 border-[var(--brand-cyan)] bg-[var(--brand-lime)] px-8 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-ink)] shadow-none hover:bg-[color-mix(in_srgb,var(--brand-lime)_92%,white)] sm:text-sm"
                      >
                        Ir al panel
                      </Button>
                    </Link>
                    <Link href="/#rutinas" className="w-full sm:w-auto sm:min-w-[220px]">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 w-full rounded-none border-2 border-[var(--brand-cyan)] bg-transparent px-8 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-cyan)] shadow-none hover:bg-[var(--brand-cyan)]/10 sm:text-sm"
                      >
                        Ver programas
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Programs */}
        <section id="rutinas" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl space-y-3">
              <h2 className="landing-heading text-4xl text-[var(--brand-cyan)] sm:text-5xl">Transforma tu cuerpo</h2>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/55">
                Planes diseñados para resultados medibles, no modas pasajeras.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {programs.map((plan) => {
                const Icon = plan.icon;
                const accentLime = plan.accent === 'lime';
                return (
                  <article
                    key={plan.id}
                    className="group relative flex flex-col border border-white/10 bg-[color-mix(in_srgb,var(--surface-raised)_94%,black)] p-8 transition-colors hover:border-[var(--brand-lime)]/40"
                  >
                    {plan.badge && (
                      <span className="absolute right-4 top-4 bg-[var(--brand-lime)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--brand-ink)]">
                        {plan.badge}
                      </span>
                    )}
                    <div
                      className={`mb-5 inline-flex h-12 w-12 items-center justify-center border ${
                        accentLime ? 'border-[var(--brand-lime)]/50 text-[var(--brand-lime)]' : 'border-[var(--brand-cyan)]/50 text-[var(--brand-cyan)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="landing-heading mb-3 text-xl text-white sm:text-2xl">{plan.title}</h3>
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-white/70">{plan.description}</p>
                    <Link
                      href={isAuthenticated ? '/routines' : '/register'}
                      className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-lime)] hover:underline"
                    >
                      Explorar plan
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Results + testimonial */}
        <section id="progreso" className="scroll-mt-24 border-y border-white/10 bg-black/40 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="landing-heading mb-12 text-4xl text-[var(--brand-lime)] sm:text-5xl">Resultados ganadores</h2>
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="relative aspect-[3/4] overflow-hidden border border-white/10 bg-muted">
                  <Image
                    src="/placeholder-user.jpg"
                    alt="Miembro antes del programa"
                    fill
                    className="object-cover grayscale"
                    sizes="(max-width: 1024px) 45vw, 400px"
                  />
                </div>
                <div className="relative aspect-[3/4] overflow-hidden border-2 border-[var(--brand-lime)] bg-muted ring-1 ring-[var(--brand-lime)]/30">
                  <Image
                    src="/coach-trainer.png"
                    alt="Miembro tras el programa"
                    fill
                    className="object-cover object-top grayscale contrast-[1.05]"
                    sizes="(max-width: 1024px) 45vw, 400px"
                  />
                </div>
              </div>
              <div className="relative space-y-6">
                <Quote className="h-14 w-14 text-[var(--brand-lime)] opacity-90" aria-hidden />
                <blockquote className="text-lg italic leading-relaxed text-white/90 sm:text-xl">
                  Pasé de entrenar a ciegas a tener números claros cada semana. La constancia dejó de ser teoría: ahora es
                  un hábito con nombre.
                </blockquote>
                <footer>
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-[var(--brand-cyan)]">Marcus K.</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                    Miembro élite · 6 meses
                  </p>
                </footer>
              </div>
            </div>
          </div>
        </section>

        {/* Coach */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 space-y-2">
              <h2 className="landing-heading text-4xl sm:text-5xl">
                <span className="text-white">Gilmer</span>{' '}
                <span className="text-[var(--brand-lime)]">Hernández</span>
              </h2>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--brand-cyan)]">Conoce a tu coach</p>
            </div>
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="relative aspect-[4/5] overflow-hidden border border-white/10 bg-muted">
                  <Image
                    src="/coach-trainer.png"
                    alt="Retrato del coach principal del programa"
                    fill
                    className="object-cover object-top grayscale contrast-[1.06]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={false}
                  />
                  <span className="absolute bottom-4 right-4 bg-[var(--brand-gold)] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--brand-ink)]">
                    Entrenador líder
                  </span>
                </div>
              </div>
              <div className="space-y-8">
                <p className="text-base leading-relaxed text-white/80 sm:text-lg">
                  Creo en el trabajo duro con método: progresión, recuperación y mentalidad de atleta. No vendemos
                  atajos; construimos disciplina que sobrevive a los imprevistos del día a día.
                </p>
                <p className="text-base leading-relaxed text-white/80 sm:text-lg">
                  Cada plan en FitTrack nace de la idea de ganar desde adentro: datos accionables, rutinas que puedes
                  sostener y un estándar claro de excelencia.
                </p>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="border-l-4 border-[var(--brand-cyan)] pl-5">
                    <p className="landing-heading text-3xl text-white">10+</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/55">Años de experiencia</p>
                  </div>
                  <div className="border-l-4 border-[var(--brand-cyan)] pl-5">
                    <p className="landing-heading text-3xl text-white">5K+</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/55">Vidas transformadas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community CTA strip */}
        <section id="comunidad" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl border border-white/10 bg-[color-mix(in_srgb,var(--surface-raised)_96%,black)] px-8 py-12 text-center sm:px-12">
            <h2 className="landing-heading text-3xl text-white sm:text-4xl">Comunidad que entrena en serio</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
              Comparte avances, retos y técnica con personas que ya eligieron el camino difícil. La élite no es un
              cartel: es constancia compartida.
            </p>
            {!isAuthenticated && (
              <Link href="/register" className="mt-8 inline-block">
                <Button className="h-12 rounded-none px-10 text-sm font-black uppercase tracking-[0.14em] shadow-[4px_4px_0_0_var(--brand-cyan)]">
                  Crear cuenta
                </Button>
              </Link>
            )}
          </div>
        </section>

        {!isAuthenticated && (
          <section className="px-4 pb-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl border border-[var(--brand-lime)]/25 bg-gradient-to-br from-white/[0.06] to-transparent px-8 py-12 text-center sm:py-14">
              <h2 className="landing-heading text-3xl text-white sm:text-4xl">¿Listo para el siguiente nivel?</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/65 sm:text-base">
                Regístrate gratis y lleva tu entrenamiento al mismo sistema que usan quienes no negocian sus objetivos.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/register">
                  <Button className="h-12 w-full rounded-none px-8 text-sm font-black uppercase sm:w-auto">Empezar ahora</Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-none border-2 border-white/25 bg-transparent px-8 text-sm font-black uppercase text-white hover:bg-white/5 sm:w-auto"
                  >
                    Ya tengo cuenta
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-white/10 bg-black/50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-6">
              <p className="landing-heading max-w-xs text-2xl leading-tight text-[var(--brand-lime)] lg:max-w-none">
                Proyecto Ganar desde Adentro
              </p>
              <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                <Link href="/login" className="hover:text-[var(--brand-lime)]">
                  Privacidad
                </Link>
                <Link href="/login" className="hover:text-[var(--brand-lime)]">
                  Términos
                </Link>
                <Link href="/login" className="hover:text-[var(--brand-lime)]">
                  Soporte
                </Link>
                <span className="text-white/25">|</span>
                <a href="https://instagram.com" className="hover:text-[var(--brand-lime)]" rel="noopener noreferrer" target="_blank">
                  Instagram
                </a>
                <a href="https://twitter.com" className="hover:text-[var(--brand-lime)]" rel="noopener noreferrer" target="_blank">
                  Twitter
                </a>
              </nav>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:text-right">
              © {new Date().getFullYear()} Proyecto Ganar desde Adentro · FitTrack. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
