'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { FitnessDashboardBodyProgressChart } from '@/components/dashboard/fitness-dashboard-body-progress-chart';
import { FitnessDashboardWeekConsistency } from '@/components/dashboard/fitness-dashboard-week-consistency';
import { MyTrainerCard } from '@/components/dashboard/my-trainer-card';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAthleteData } from '@/hooks/use-athlete-data';
import { useMetrics } from '@/hooks/use-metrics';
import { useNutrition } from '@/hooks/use-nutrition';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { NutritionDashboardCta } from '@/components/nutrition/nutrition-dashboard-cta';
import {
  Award,
  BarChart3,
  Calendar,
  Check,
  Dumbbell,
  Flame,
  TrendingUp,
  LogOut,
  User,
  Zap,
  Target,
  Loader2,
} from 'lucide-react';

function StatSparkline({ values, highlight }: { values: readonly number[]; highlight?: boolean }) {
  const w = 72;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const n = values.length;
  const pts = values
    .map((v, i) => {
      const x = n <= 1 ? w / 2 : (i / (n - 1)) * (w - 2) + 1;
      const y = h - 2 - ((v - min) / range) * (h - 6);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      width={w}
      height={h}
      className={highlight ? 'text-cyan-400/90' : 'text-lime-400/90'}
      aria-hidden
    >
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" points={pts} />
    </svg>
  );
}

function StatCard({
  title,
  value,
  trend,
  spark,
  icon: Icon,
  highlight,
}: {
  title: string;
  value: string;
  trend: string;
  spark: readonly number[];
  icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div className="dashboard-v3-panel relative overflow-hidden rounded-2xl border border-[#2a2e32] p-5 transition-colors hover:border-[#3d4248]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-xs tracking-wider text-[#9ca3af]">{title}</h3>
        <Icon className="size-5 shrink-0 opacity-80 text-[#d1d5db]" aria-hidden />
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-4xl font-bold text-white">{value}</p>
        <StatSparkline values={spark} highlight={highlight} />
      </div>
      <p className={cn('mt-2 text-xs', highlight ? 'text-cyan-400' : 'text-lime-400')}>{trend}</p>
    </div>
  );
}

function RoutineCard({
  title,
  desc,
  level,
  icon: Icon,
}: {
  title: string;
  desc: string;
  level: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href="/routines"
      className="group flex cursor-pointer items-center justify-between rounded-xl border border-[#3f4449]/50 bg-[#23272A] p-4 transition-colors hover:border-[#5c636a]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-black/40 text-[#9ca3af]">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white">{title}</h4>
          <p className="text-xs text-[#9ca3af]">{desc}</p>
        </div>
      </div>
      <span className="shrink-0 rounded border border-[#4b5563] px-2 py-1 text-[10px] text-[#d1d5db]">{level}</span>
    </Link>
  );
}

const PREMIUM_FEATURES_FALLBACK = [
  'Rutinas personalizadas y seguimiento avanzado',
  'Métricas corporales y gráficos de progreso',
  'Plan nutricional y coach Titan (según plan)',
] as const;

export function FitnessDashboardView() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeRoutine,
    weekCompletedCount,
    weeklyPlan,
    weekSessionLogs,
    weekStartDate,
    latestSession,
    mealPlan,
    isLoading: athleteLoading,
  } = useAthleteData();
  const { getLatestEntry, getProgressChange, entries, isLoading: metricsLoading } = useMetrics();
  const latestMetric = getLatestEntry();
  const { getWeeklyAdherence, isLoading: nutritionLoading } = useNutrition();

  const displayName = user?.first_name ?? 'Atleta';
  const isDataLoading = athleteLoading || metricsLoading || nutritionLoading;

  const weeklyAdherence = getWeeklyAdherence();
  const adherencePct = weeklyAdherence.adherencePercent;

  const weightChange = getProgressChange('weight');
  const bodyFatChange = getProgressChange('bodyFat');

  const weekSpark = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const log of weekSessionLogs) {
      if (log.sessionOutcome === 'completed' || log.completed) {
        const d = new Date(log.scheduledDate + 'T12:00:00');
        const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        counts[idx] += 1;
      }
    }
    return counts;
  }, [weekSessionLogs]);

  const latestSessionBestWeight = useMemo(() => {
    if (!latestSession?.setLogs?.length) return null;
    const weights = latestSession.setLogs
      .map((l) => l.weightKg)
      .filter((w): w is number => w != null && w > 0);
    return weights.length > 0 ? Math.max(...weights) : null;
  }, [latestSession]);

  const progressWeightSpark = useMemo(() => {
    const values = entries
      .map((entry) => entry.weight)
      .filter((weight): weight is number => weight != null && weight > 0)
      .slice(-7);
    return values.length > 0 ? values : [0];
  }, [entries]);

  const stats = [
    {
      title: 'ENTRENAMIENTOS',
      value: isDataLoading ? '—' : String(weekCompletedCount),
      trend: activeRoutine
        ? `${weekCompletedCount} esta semana · ${activeRoutine.name}`
        : 'Sin rutina asignada',
      spark: weekSpark.length ? weekSpark : [0, 0, 0, 0, 0, 0, 0],
      icon: Calendar,
      highlight: false,
    },
    {
      title: 'NUTRICIÓN',
      value: adherencePct > 0 ? `${adherencePct}%` : '—',
      trend: mealPlan ? 'Plan asignado activo' : 'Sin plan nutricional',
      spark: weeklyAdherence.days.map((d) => (d.withinTarget ? 1 : 0)),
      icon: Flame,
      highlight: false,
    },
    {
      title: 'ÚLTIMA MÉTRICA',
      value: latestMetric?.weight != null ? `${latestMetric.weight} kg` : '—',
      trend: latestMetric?.bodyFat != null ? `${latestMetric.bodyFat}% grasa` : 'Registra tu primera medición',
      spark: [latestMetric?.weight ?? 0],
      icon: Award,
      highlight: false,
    },
    {
      title: 'PROGRESO',
      value: weightChange != null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '—',
      trend:
        bodyFatChange != null
          ? `Grasa: ${bodyFatChange > 0 ? '+' : ''}${bodyFatChange.toFixed(1)} pts`
          : 'Compara en Métricas',
      spark: progressWeightSpark,
      icon: TrendingUp,
      highlight: true,
    },
  ] as const;

  const handleLogout = () => {
    logout();
    router.push('/');
  };
  const initial = (displayName.trim().charAt(0) || 'F').toUpperCase();
  const isAdmin = user?.role === 'admin';
  const membership = user?.membership;

  const planName = isAdmin ? 'ADMIN' : (membership?.name ?? 'Sin plan');
  const planDays = isAdmin ? null : membership ? membership.daysRemaining : null;
  const planFeatures = membership?.features?.length
    ? membership.features
    : membership
      ? []
      : [...PREMIUM_FEATURES_FALLBACK];

  const planBarPct = (() => {
    if (isAdmin) return 100;
    if (membership) {
      const d = planDays ?? 0;
      const total = membership.durationDays ?? 365;
      if (d <= 0) return 0;
      if (total <= 0) return 4;
      return Math.min(100, Math.max(4, (d / total) * 100));
    }
    return 33;
  })();

  const navLinkClass = (href: string) =>
    cn(
      'text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary',
      pathname === href && 'text-primary',
    );

  return (
    <div className="flex min-h-screen flex-col">
      <ExpirationAlert />

      <nav className="sticky top-0 z-50 border-b border-primary/20 bg-background/85 shadow-[0_8px_32px_rgb(0_0_0_/_0.35)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="group flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2 text-primary-foreground brand-glow-primary transition-transform group-hover:scale-105">
              <Dumbbell className="h-5 w-5 text-primary-foreground" aria-hidden />
            </div>
            <span className="brand-title hidden text-xl font-black uppercase tracking-wider sm:inline brand-text-gradient">
              FitTrack
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden items-center gap-6 md:flex">
              <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                Dashboard
              </Link>
              <Link href="/routines" className={navLinkClass('/routines')}>
                Rutinas
              </Link>
              <Link href="/metrics" className={navLinkClass('/metrics')}>
                Métricas
              </Link>
              <Link href="/nutrition" className={navLinkClass('/nutrition')}>
                Nutrición
              </Link>
              <Link href="/memberships" className={navLinkClass('/memberships')}>
                Membresías
              </Link>
              {isAdmin && (
                <Link href="/admin" className={navLinkClass('/admin')}>
                  Admin
                </Link>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-secondary/50 bg-card/70 text-foreground hover:bg-secondary/10"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-black text-primary-foreground">
                    {user?.first_name?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                  <span className="hidden max-w-[10rem] truncate sm:inline text-xs font-extrabold uppercase tracking-[0.12em]">
                    {user?.first_name ?? 'Usuario'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="cursor-pointer gap-2 md:hidden">
                  <Link href="/dashboard" className="flex">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-2 md:hidden">
                  <Link href="/routines" className="flex">
                    Rutinas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-2 md:hidden">
                  <Link href="/metrics" className="flex">
                    Métricas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-2 md:hidden">
                  <Link href="/nutrition" className="flex">
                    Nutrición
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-2 md:hidden">
                  <Link href="/memberships" className="flex">
                    Membresías
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer gap-2 md:hidden">
                    <Link href="/admin" className="flex">
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <div className="my-2 border-t border-border md:hidden" />
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link href="/profile" className="flex">
                    <User className="h-4 w-4" />
                    <span>Mi perfil</span>
                  </Link>
                </DropdownMenuItem>
                <div className="my-2 border-t border-border" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="dashboard-v3-dotted-bg flex-1 p-4 sm:p-8">
      <header className="mb-8 grid gap-8 sm:mb-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter text-white sm:text-6xl md:text-7xl">
            Hola, <span className="dashboard-v3-text-glow-cyan text-cyan-400">{displayName}</span>
          </h1>
          <p className="text-lg text-[#9ca3af]">Continuemos con tu transformación fitness</p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <div
            className="relative flex size-36 items-center justify-center rounded-full border-2 border-lime-400/80 bg-gradient-to-br from-[#1f2326] to-[#2d3338] text-5xl font-black text-white shadow-[0_0_32px_rgba(163,230,53,0.35),0_0_64px_rgba(34,211,238,0.12)] sm:size-44 sm:text-6xl"
            aria-hidden
          >
            {initial}
          </div>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:mb-10 md:grid-cols-2 lg:grid-cols-4">
        {isDataLoading ? (
          <div className="col-span-full flex items-center justify-center py-8 text-[#9ca3af]">
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
            Cargando KPIs…
          </div>
        ) : (
          stats.map((s) => (
            <StatCard key={s.title} {...s} icon={s.icon} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="dashboard-v3-panel relative rounded-2xl border border-[#2a2e32] p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="flex items-center gap-3 text-2xl font-bold uppercase text-white">
                  <span className="rounded bg-lime-400 p-1 text-black">
                    <Dumbbell className="size-5" aria-hidden />
                  </span>
                  Mis Rutinas
                </h2>
              </div>
              <Link href="/routines" className="text-sm font-medium text-cyan-400 hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {activeRoutine ? (
                <RoutineCard
                  title={activeRoutine.name.toUpperCase()}
                  desc={`${activeRoutine.exercises.length} EJERCICIOS • ${activeRoutine.duration} MIN`}
                  level={activeRoutine.difficulty.toUpperCase()}
                  icon={Target}
                />
              ) : (
                <div className="col-span-full rounded-xl border border-dashed border-[#3f4449]/50 bg-[#23272A] p-6 text-center">
                  <p className="text-sm text-[#9ca3af]">
                    Tu entrenador aún no te asignó una rutina.
                  </p>
                  <Link href="/routines" className="mt-2 inline-block text-sm text-cyan-400 hover:underline">
                    Ver rutinas
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/metrics"
              className="dashboard-v3-panel rounded-2xl border border-[#2a2e32] p-4 transition-colors hover:border-cyan-400/40"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-400">
                <BarChart3 className="size-5" aria-hidden />
              </div>
              <h3 className="text-sm font-bold uppercase text-white">Métricas</h3>
              <p className="mt-1 text-xs text-[#9ca3af]">Registrar peso, grasa y medidas.</p>
            </Link>
            <NutritionDashboardCta />
            <Link
              href="/profile"
              className="dashboard-v3-panel rounded-2xl border border-[#2a2e32] p-4 transition-colors hover:border-[#5c636a]"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-white/10 text-[#d1d5db]">
                <User className="size-5" aria-hidden />
              </div>
              <h3 className="text-sm font-bold uppercase text-white">Perfil</h3>
              <p className="mt-1 text-xs text-[#9ca3af]">Actualiza tus datos personales.</p>
            </Link>
          </div>

          <div className="dashboard-v3-panel flex min-h-[18rem] flex-col rounded-2xl border border-[#2a2e32] p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold uppercase text-white">Progreso corporal</h2>
              <Link
                href="/metrics"
                className="rounded border border-cyan-400 px-4 py-1 text-sm text-cyan-400 transition-colors hover:bg-cyan-400/10"
              >
                VER TODAS
              </Link>
            </div>
            <FitnessDashboardBodyProgressChart />
          </div>
        </div>

        <div className="space-y-6">
          <div className="dashboard-v3-panel relative overflow-hidden rounded-2xl border border-cyan-400/50 p-6">
            <h3 className="mb-1 text-xs uppercase tracking-widest text-[#9ca3af]">Plan actual</h3>
            <h2 className="mb-4 text-3xl font-bold text-white">{planName}</h2>
            <ul className="mb-6 space-y-2">
              {planFeatures.map((line) => (
                <li key={line} className="flex gap-2 text-xs text-[#d1d5db]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-lime-400" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-xs text-[#d1d5db]">
                <span>TIEMPO RESTANTE</span>
                <span className="text-lime-400">
                  {isAdmin ? '—' : planDays != null ? `${planDays} DÍAS` : '—'}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-[#374151]">
                <div
                  className="h-full rounded-full bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                  style={{ width: `${planBarPct}%` }}
                />
              </div>
              {!isAdmin && membership && planDays === 0 && (
                <p className="mt-2 text-xs text-amber-400/90">Tu plan vence hoy. Renueva para seguir entrenando.</p>
              )}
            </div>
            {!membership && !isAdmin && (
              <p className="mb-4 text-xs text-[#9ca3af]">Demo: sin membresía activa; la barra es ilustrativa.</p>
            )}
            {isAdmin && <p className="mb-4 text-xs text-[#9ca3af]">Cuenta administrador.</p>}
            <div className="flex flex-col gap-3">
              <Link
                href="/metrics"
                className="block w-full rounded border border-cyan-400 py-3 text-center text-sm font-semibold text-cyan-400 transition-colors hover:bg-cyan-400/10"
              >
                VER MÉTRICAS
              </Link>
              <Link
                href={isAdmin ? '/admin' : '/memberships'}
                className="block w-full rounded border border-[#4b5563] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                {isAdmin ? 'PANEL ADMIN' : 'CAMBIAR PLAN'}
              </Link>
            </div>
          </div>

          <FitnessDashboardWeekConsistency
            weeklyPlan={weeklyPlan}
            weekSessionLogs={weekSessionLogs}
            weekStartDate={weekStartDate}
          />

          <MyTrainerCard />

          <div className="dashboard-v3-panel relative rounded-2xl border border-lime-400/50 p-6">
            <div className="absolute right-0 top-0 rounded-bl-lg bg-amber-500 px-2 py-1 text-xs font-bold text-black">
              {activeRoutine ? 'ACTIVO' : 'PENDIENTE'}
            </div>
            <h2 className="mb-1 text-xl font-bold uppercase text-white">Próximo entrenamiento</h2>
            {activeRoutine ? (
              <>
                <p className="mb-4 text-xs text-lime-400">RUTINA ASIGNADA POR TU ENTRENADOR</p>
                <div className="mb-4 rounded-lg bg-black/30 p-4">
                  <h3 className="font-bold text-white">{activeRoutine.name.toUpperCase()}</h3>
                  <p className="text-sm text-[#9ca3af]">
                    {activeRoutine.exercises.length} EJERCICIOS • {activeRoutine.duration} MIN
                  </p>
                  {latestSession && (
                    <p className="mt-2 text-xs text-[#9ca3af]">
                      Última sesión: {latestSession.scheduledDate}
                      {(latestSession.failedSets ?? 0) > 0 && (
                        <span className="text-amber-400">
                          {' '}
                          · {(latestSession.failedSets ?? 0)} fallos
                        </span>
                      )}
                      {latestSessionBestWeight != null && (
                        <span className="text-cyan-400"> · Mejor carga: {latestSessionBestWeight} kg</span>
                      )}
                    </p>
                  )}
                </div>
                <Link
                  href="/routines"
                  className="block w-full rounded bg-lime-400 py-3 text-center font-bold text-black shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-colors hover:bg-lime-500"
                >
                  INICIAR AHORA
                </Link>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-[#9ca3af]">Esperando asignación de tu entrenador.</p>
                <Link
                  href="/routines"
                  className="block w-full rounded border border-[#4b5563] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/5"
                >
                  VER RUTINAS
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
