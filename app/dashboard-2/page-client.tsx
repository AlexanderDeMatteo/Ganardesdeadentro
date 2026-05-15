'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { MetricsSummary } from '@/components/metrics/metrics-summary';
import { MembershipCard } from '@/components/membership/membership-card';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Dumbbell,
  TrendingUp,
  User,
  Settings,
  Calendar,
  Flame,
  Target,
  Award,
  Zap,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockRoutines = [
  { id: 1, name: 'Día de piernas', duration: 60, exercises: 6, difficulty: 'Intermedio', icon: Target },
  { id: 2, name: 'Pecho y tríceps', duration: 45, exercises: 5, difficulty: 'Intermedio', icon: Zap },
  { id: 3, name: 'Espalda y bíceps', duration: 50, exercises: 5, difficulty: 'Intermedio', icon: Dumbbell },
] as const;

const mockStats = [
  { label: 'Entrenamientos', value: '4', icon: Calendar, iconClass: 'text-primary' },
  { label: 'Calorías quemadas', value: '1,240', icon: Flame, iconClass: 'text-destructive' },
  { label: 'Racha actual', value: '15 días', icon: Award, iconClass: 'text-accent' },
  { label: 'Progreso total', value: '+8.5%', icon: TrendingUp, iconClass: 'text-secondary' },
];

function Dashboard2Inner() {
  const { user } = useAuth();
  const first = user?.first_name ?? 'Atleta';

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-10">
          <p className="dm-label mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Champion dashboard
          </p>
          <h1 className="dm-display text-4xl uppercase leading-tight text-foreground md:text-5xl">
            Hola, <span className="text-secondary">{first}</span>
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Continuemos con tu transformación fitness.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {mockStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="border-2 border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <p className="dm-label text-[10px] font-bold uppercase leading-tight text-muted-foreground">
                    {stat.label}
                  </p>
                  <Icon className={cn('size-5 shrink-0', stat.iconClass)} aria-hidden />
                </div>
                <p className="dm-display text-2xl text-foreground md:text-3xl">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="relative overflow-hidden border-2 border-border bg-muted/30 p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary p-2 text-primary-foreground">
                    <Dumbbell className="size-6" />
                  </div>
                  <h2 className="dm-display text-2xl text-foreground">Mis rutinas</h2>
                </div>
                <Link
                  href="/routines"
                  className="dm-label border-b-2 border-primary text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:text-secondary"
                >
                  Ver todas
                </Link>
              </div>
              <div className="space-y-2">
                {mockRoutines.map((routine) => {
                  const Icon = routine.icon;
                  return (
                    <Link
                      key={routine.id}
                      href="/routines"
                      className="group flex cursor-pointer items-center justify-between border-2 border-border bg-background p-4 transition-colors hover:border-primary"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center bg-muted">
                          <Icon className="size-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div>
                          <p className="dm-display text-lg leading-none text-foreground">{routine.name}</p>
                          <p className="dm-label mt-1 text-[11px] font-medium uppercase text-muted-foreground">
                            {routine.exercises} ejercicios · {routine.duration} min
                          </p>
                        </div>
                      </div>
                      <span className="dm-label bg-muted px-2 py-1 text-[10px] font-bold uppercase text-primary">
                        {routine.difficulty}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Link
                href="/metrics"
                className="group border-2 border-border bg-muted/30 p-6 transition-colors hover:bg-muted/50"
              >
                <div className="mb-4 flex size-10 items-center justify-center bg-secondary text-secondary-foreground">
                  <TrendingUp className="size-5" />
                </div>
                <h3 className="dm-display mb-1 text-xl text-foreground">Métricas</h3>
                <p className="text-sm text-muted-foreground">Sigue tu progreso diario y ajusta tus metas.</p>
              </Link>
              <Link
                href="/profile"
                className="group border-2 border-border bg-muted/30 p-6 transition-colors hover:bg-muted/50"
              >
                <div className="mb-4 flex size-10 items-center justify-center bg-primary text-primary-foreground">
                  <User className="size-5" />
                </div>
                <h3 className="dm-display mb-1 text-xl text-foreground">Perfil</h3>
                <p className="text-sm text-muted-foreground">Actualiza tu información y nivel de fitness.</p>
              </Link>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <MembershipCard variant="brutalist" />
            <MetricsSummary variant="brutalist" />

            <section className="border-2 border-border bg-muted/30 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Flame className="size-5 text-secondary" />
                <h3 className="dm-display text-xl text-foreground">Esta semana</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Entrenamientos completados</p>
                  <div className="relative mt-1 h-2 w-full overflow-hidden bg-border">
                    <div className="absolute left-0 top-0 h-full w-4/5 bg-primary" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">4 de 5</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consistencia</p>
                  <div className="relative mt-1 h-2 w-full overflow-hidden bg-border">
                    <div className="absolute left-0 top-0 h-full w-3/4 bg-secondary" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">75%</p>
                </div>
              </div>
            </section>

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="block border-2 border-border bg-muted/30 p-6 transition-colors hover:border-primary/50"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Settings className="size-5 text-primary" />
                  <h3 className="dm-display text-xl text-foreground">Panel admin</h3>
                </div>
                <p className="text-sm text-muted-foreground">Gestiona el contenido de la plataforma.</p>
              </Link>
            )}

            <section className="relative border-2 border-primary bg-muted/30 p-6">
              <div className="absolute -right-2 -top-2 bg-secondary px-2 py-1 dm-label text-[10px] font-bold uppercase text-secondary-foreground">
                Urgente
              </div>
              <div className="mb-2 flex items-start justify-between">
                <h3 className="dm-display text-xl text-foreground">Próximo entrenamiento</h3>
                <Info className="size-5 text-muted-foreground" aria-hidden />
              </div>
              <p className="dm-label mb-4 text-[11px] font-bold uppercase text-muted-foreground">
                Dentro de <span className="text-primary">2 horas</span>
              </p>
              <div className="mb-6 border border-border bg-background p-4">
                <p className="dm-display text-lg text-foreground">Pecho y tríceps</p>
                <p className="dm-label mt-1 text-[11px] font-medium uppercase text-muted-foreground">
                  5 ejercicios · 45 min
                </p>
              </div>
              <Button
                asChild
                className="dm-label h-12 w-full rounded-none bg-primary text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-[4px_4px_0_0_var(--brand-cyan)] hover:brightness-110"
              >
                <Link href="/routines">Iniciar ahora</Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function Dashboard2Page() {
  return (
    <ProtectedRoute>
      <Dashboard2Inner />
    </ProtectedRoute>
  );
}
