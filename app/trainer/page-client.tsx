'use client';

import { useTrainer } from '@/hooks/use-trainer';
import { useAuth } from '@/app/context/auth-context';
import { Users, Dumbbell, Link as LinkIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const {
    myAthletes,
    stats,
    getActiveAssignmentForAthlete,
    getRoutineName,
    isHydrated,
  } = useTrainer();

  const athletesWithoutRoutine = myAthletes.filter((a) => !getActiveAssignmentForAthlete(a.id));

  const kpiCards = [
    {
      label: 'Mis atletas',
      value: stats.athleteCount,
      icon: Users,
      href: '/trainer/athletes',
      color: 'from-primary to-secondary',
    },
    {
      label: 'Rutinas creadas',
      value: stats.routineCount,
      icon: Dumbbell,
      href: '/trainer/routines',
      color: 'from-secondary to-accent',
    },
    {
      label: 'Asignaciones activas',
      value: stats.activeAssignments,
      icon: LinkIcon,
      href: '/trainer/assignments',
      color: 'from-primary to-accent',
    },
    {
      label: 'Cobertura rutinas',
      value: `${stats.routineCoverage}%`,
      icon: AlertCircle,
      href: '/trainer/assignments',
      color: 'from-accent to-destructive',
    },
  ];

  if (!isHydrated) {
    return null;
  }

  return (
    <div className="space-y-12 px-8 py-12">
      <div>
        <p className="brand-kicker">Panel entrenador</p>
        <h1 className="brand-title mb-2 text-5xl font-black">Hola, {user?.first_name}</h1>
        <p className="text-lg text-muted-foreground">
          Gestiona a tus atletas asignados, rutinas y seguimiento de progreso.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="brand-card brand-card-hover h-full cursor-pointer rounded-2xl p-6">
                <div className={`mb-4 w-fit rounded-xl bg-gradient-to-br ${stat.color} p-3 text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-4xl font-black text-foreground">{stat.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="brand-card rounded-2xl p-8">
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
            </div>
            Sin rutina activa
          </h2>
          {athletesWithoutRoutine.length > 0 ? (
            <div className="space-y-3">
              {athletesWithoutRoutine.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between rounded-lg border border-secondary/20 bg-secondary/5 p-4"
                >
                  <div>
                    <p className="font-medium">{athlete.name}</p>
                    <p className="text-sm text-muted-foreground">{athlete.email}</p>
                  </div>
                  <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-500">
                    {athlete.membershipLevel}
                  </span>
                </div>
              ))}
              <Link href="/trainer/assignments">
                <Button className="mt-4 w-full">Asignar rutinas</Button>
              </Link>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Todos tus atletas tienen rutina activa
            </p>
          )}
        </div>

        <div className="brand-card rounded-2xl p-8">
          <h2 className="mb-6 text-2xl font-black uppercase tracking-tight">Mis atletas</h2>
          <div className="space-y-3">
            {myAthletes.slice(0, 5).map((athlete) => {
              const assignment = getActiveAssignmentForAthlete(athlete.id);
              return (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between rounded-lg border border-secondary/20 p-4"
                >
                  <div>
                    <p className="font-medium">{athlete.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment
                        ? getRoutineName(assignment.routineId)
                        : 'Sin rutina'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/trainer/athletes">
            <Button variant="outline" className="mt-4 w-full">
              Ver todos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
