'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeKpiStrip } from '@/components/admin-v2/prime-kpi-strip';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { FitnessDashboardBodyProgressChart } from '@/components/dashboard/fitness-dashboard-body-progress-chart';
import { FitnessDashboardWeekConsistency } from '@/components/dashboard/fitness-dashboard-week-consistency';
import { MyTrainerCard } from '@/components/dashboard/my-trainer-card';
import { NutritionDashboardCta } from '@/components/nutrition/nutrition-dashboard-cta';
import { useAthleteData } from '@/hooks/use-athlete-data';
import { useMetrics } from '@/hooks/use-metrics';
import { useNutrition } from '@/hooks/use-nutrition';
import {
  Award,
  BarChart3,
  Calendar,
  Check,
  Dumbbell,
  Flame,
  Target,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PREMIUM_FEATURES_FALLBACK = [
  'Rutinas personalizadas y seguimiento avanzado',
  'Métricas corporales y gráficos de progreso',
  'Plan nutricional y coach Titan (según plan)',
] as const;

function QuickLinkCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="gp-module gp-module-corner block p-4 transition-colors hover:gp-phosphor-glow"
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg gp-bg-surface-variant gp-text-phosphor">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="gp-mono text-sm font-bold uppercase gp-text-primary">{title}</h3>
      <p className="mt-1 text-xs gp-text-muted">{description}</p>
    </Link>
  );
}

export function AthletePrimeDashboard() {
  const { user } = useAuth();
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
  const { getLatestEntry, getProgressChange, isLoading: metricsLoading } = useMetrics();
  const latestMetric = getLatestEntry();
  const { getWeeklyAdherence, isLoading: nutritionLoading } = useNutrition();

  const displayName = user?.first_name ?? 'Atleta';
  const isDataLoading = athleteLoading || metricsLoading || nutritionLoading;
  const isAdmin = user?.role === 'admin';
  const membership = user?.membership;

  const weeklyAdherence = getWeeklyAdherence();
  const adherencePct = weeklyAdherence.adherencePercent;
  const weightChange = getProgressChange('weight');
  const bodyFatChange = getProgressChange('bodyFat');

  const latestSessionBestWeight = useMemo(() => {
    if (!latestSession?.setLogs?.length) return null;
    const weights = latestSession.setLogs
      .map((l) => l.weightKg)
      .filter((w): w is number => w != null && w > 0);
    return weights.length > 0 ? Math.max(...weights) : null;
  }, [latestSession]);

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

  const initial = (displayName.trim().charAt(0) || 'F').toUpperCase();

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72 rounded-lg gp-bg-surface-high" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg gp-bg-surface-high" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <PrimePageHeader
          title={`Hola, ${displayName}`}
          subtitle="Continuemos con tu transformación fitness"
        />
        <div
          className="gp-module gp-module-corner flex size-24 shrink-0 items-center justify-center self-center text-4xl font-black gp-text-primary gp-phosphor-glow sm:size-28 sm:text-5xl lg:self-auto"
          aria-hidden
        >
          {initial}
        </div>
      </div>

      <PrimeKpiStrip
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        items={[
          {
            label: 'Entrenamientos',
            value: weekCompletedCount,
            icon: Calendar,
            footer: activeRoutine
              ? `${weekCompletedCount} esta semana · ${activeRoutine.name}`
              : 'Sin rutina asignada',
            href: '/routines',
          },
          {
            label: 'Nutrición',
            value: adherencePct > 0 ? `${adherencePct}%` : '—',
            icon: Flame,
            footer: mealPlan ? 'Plan asignado activo' : 'Sin plan nutricional',
            href: '/nutrition',
          },
          {
            label: 'Última métrica',
            value: latestMetric?.weight != null ? `${latestMetric.weight} kg` : '—',
            icon: Award,
            footer:
              latestMetric?.bodyFat != null
                ? `${latestMetric.bodyFat}% grasa`
                : 'Registra tu primera medición',
            href: '/metrics',
          },
          {
            label: 'Progreso',
            value:
              weightChange != null
                ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`
                : '—',
            icon: TrendingUp,
            layout: 'critical',
            footer:
              bodyFatChange != null
                ? `Grasa: ${bodyFatChange > 0 ? '+' : ''}${bodyFatChange.toFixed(1)} pts`
                : 'Compara en Métricas',
            href: '/metrics',
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PrimeModule
            modId="A01"
            title="MIS_RUTINAS"
            headerAction={
              <Link href="/routines" className="gp-mono text-xs gp-text-phosphor hover:underline">
                Ver todas
              </Link>
            }
          >
            <div className="p-4">
              {activeRoutine ? (
                <Link
                  href="/routines"
                  className="gp-module gp-module-corner flex items-center justify-between p-4 transition-colors hover:gp-phosphor-glow"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded gp-bg-surface-variant gp-text-muted">
                      <Target className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h4 className="gp-mono text-sm font-bold gp-text-primary">
                        {activeRoutine.name.toUpperCase()}
                      </h4>
                      <p className="text-xs gp-text-muted">
                        {activeRoutine.exercises.length} ejercicios · {activeRoutine.duration} min
                      </p>
                    </div>
                  </div>
                  <span className="gp-mono shrink-0 rounded border gp-border-outline px-2 py-1 text-[10px] gp-text-muted">
                    {activeRoutine.difficulty.toUpperCase()}
                  </span>
                </Link>
              ) : (
                <div className="rounded-lg border border-dashed gp-border-outline gp-bg-surface-variant p-6 text-center">
                  <p className="text-sm gp-text-muted">
                    Tu entrenador aún no te asignó una rutina.
                  </p>
                  <Link href="/routines" className="mt-2 inline-block text-sm gp-text-phosphor hover:underline">
                    Ver rutinas
                  </Link>
                </div>
              )}
            </div>
          </PrimeModule>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickLinkCard
              href="/metrics"
              title="Métricas"
              description="Registrar peso, grasa y medidas."
              icon={BarChart3}
            />
            <NutritionDashboardCta />
            <QuickLinkCard
              href="/profile"
              title="Perfil"
              description="Actualiza tus datos personales."
              icon={User}
            />
          </div>

          <PrimeModule modId="A02" title="PROGRESO_CORPORAL">
            <div className="p-4">
              <FitnessDashboardBodyProgressChart />
            </div>
          </PrimeModule>
        </div>

        <div className="space-y-6">
          <PrimeModule modId="A03" title="PLAN_ACTUAL">
            <div className="space-y-4 p-4">
              <h2 className="gp-display text-2xl gp-text-primary">{planName}</h2>
              <ul className="space-y-2">
                {planFeatures.map((line) => (
                  <li key={line} className="flex gap-2 text-xs gp-text-muted">
                    <Check className="mt-0.5 size-3.5 shrink-0 gp-text-phosphor" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div>
                <div className="mb-2 flex justify-between text-xs gp-text-muted">
                  <span>Tiempo restante</span>
                  <span className="gp-text-phosphor">
                    {isAdmin ? '—' : planDays != null ? `${planDays} días` : '—'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full gp-bg-surface-variant">
                  <div
                    className="h-full rounded-full bg-[var(--gp-phosphor)] gp-phosphor-glow"
                    style={{ width: `${planBarPct}%` }}
                  />
                </div>
                {!isAdmin && membership && planDays === 0 && (
                  <p className="mt-2 text-xs text-[var(--gp-error)]">
                    Tu plan vence hoy. Renueva para seguir entrenando.
                  </p>
                )}
              </div>
              {!membership && !isAdmin && (
                <p className="text-xs gp-text-dim">Sin membresía activa; la barra es ilustrativa.</p>
              )}
              {isAdmin && <p className="text-xs gp-text-dim">Cuenta administrador.</p>}
              <div className="flex flex-col gap-3">
                <Link
                  href="/metrics"
                  className="gp-mono block w-full rounded border gp-border-outline py-3 text-center text-sm gp-text-phosphor transition-colors hover:gp-bg-surface-variant"
                >
                  Ver métricas
                </Link>
                <Link
                  href={isAdmin ? '/admin-v2' : '/memberships'}
                  className="gp-mono block w-full rounded border gp-border-outline py-3 text-center text-sm gp-text-primary transition-colors hover:gp-bg-surface-variant"
                >
                  {isAdmin ? 'Panel admin' : 'Cambiar plan'}
                </Link>
              </div>
            </div>
          </PrimeModule>

          <FitnessDashboardWeekConsistency
            weeklyPlan={weeklyPlan}
            weekSessionLogs={weekSessionLogs}
            weekStartDate={weekStartDate}
          />

          <MyTrainerCard />

          <PrimeModule
            modId="A04"
            title="PROXIMO_ENTRENAMIENTO"
            variant={activeRoutine ? 'default' : 'critical'}
          >
            <div className="p-4">
              {activeRoutine ? (
                <>
                  <p className="mb-4 text-xs gp-text-phosphor">Rutina asignada por tu entrenador</p>
                  <div className="mb-4 rounded-lg gp-bg-surface-variant p-4">
                    <h3 className="gp-mono font-bold gp-text-primary">{activeRoutine.name.toUpperCase()}</h3>
                    <p className="text-sm gp-text-muted">
                      {activeRoutine.exercises.length} ejercicios · {activeRoutine.duration} min
                    </p>
                    {latestSession && (
                      <p className="mt-2 text-xs gp-text-muted">
                        Última sesión: {latestSession.scheduledDate}
                        {(latestSession.failedSets ?? 0) > 0 && (
                          <span className="text-[var(--gp-error)]">
                            {' '}
                            · {(latestSession.failedSets ?? 0)} fallos
                          </span>
                        )}
                        {latestSessionBestWeight != null && (
                          <span className="gp-text-phosphor">
                            {' '}
                            · Mejor carga: {latestSessionBestWeight} kg
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/routines"
                    className="gp-chamfer gp-mono gp-btn-phosphor flex w-full items-center justify-center gap-2 py-3 text-sm font-bold"
                  >
                    <Dumbbell className="size-4" aria-hidden />
                    Iniciar ahora
                  </Link>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm gp-text-muted">Esperando asignación de tu entrenador.</p>
                  <Link
                    href="/routines"
                    className="gp-mono block w-full rounded border gp-border-outline py-3 text-center text-sm gp-text-primary transition-colors hover:gp-bg-surface-variant"
                  >
                    Ver rutinas
                  </Link>
                </>
              )}
            </div>
          </PrimeModule>
        </div>
      </div>
    </div>
  );
}
