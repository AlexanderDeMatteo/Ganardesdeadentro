'use client';

import Link from 'next/link';
import { useTrainer } from '@/hooks/use-trainer';
import { useAuth } from '@/app/context/auth-context';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeKpiStrip } from '@/components/admin-v2/prime-kpi-strip';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { AlertCircle, Dumbbell, Link2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function TrainerPrimeDashboard() {
  const { user } = useAuth();
  const {
    myAthletes,
    stats,
    getActiveAssignmentForAthlete,
    getRoutineName,
    isHydrated,
  } = useTrainer();

  const athletesWithoutRoutine = myAthletes.filter((a) => !getActiveAssignmentForAthlete(a.id));

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72 rounded-lg gp-bg-surface-high" />
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
      <PrimePageHeader
        title={`Hola, ${user?.first_name ?? 'Entrenador'}`}
        subtitle="Gestiona a tus atletas asignados, rutinas y seguimiento de progreso"
      />

      <PrimeKpiStrip
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        items={[
          {
            label: 'Mis atletas',
            value: stats.athleteCount,
            icon: Users,
            href: '/trainer-v2/athletes',
          },
          {
            label: 'Rutinas creadas',
            value: stats.routineCount,
            icon: Dumbbell,
            href: '/trainer-v2/routines',
          },
          {
            label: 'Asignaciones activas',
            value: stats.activeAssignments,
            icon: Link2,
            href: '/trainer-v2/assignments',
          },
          {
            label: 'Cobertura rutinas',
            value: `${stats.routineCoverage}%`,
            icon: AlertCircle,
            href: '/trainer-v2/assignments',
            layout: stats.routineCoverage < 100 ? 'critical' : 'satellite',
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PrimeModule
          modId="TRN-02"
          title="SIN_RUTINA_ACTIVA"
          variant={athletesWithoutRoutine.length > 0 ? 'critical' : 'default'}
        >
          <div className="space-y-3 p-4 sm:p-5">
            {athletesWithoutRoutine.length > 0 ? (
              <>
                {athletesWithoutRoutine.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between rounded border gp-border-outline/40 gp-bg-surface-variant/20 p-4"
                  >
                    <div>
                      <p className="gp-text-primary font-medium">{athlete.name}</p>
                      <p className="gp-mono text-xs gp-text-muted">{athlete.email}</p>
                    </div>
                    <span className="gp-mono rounded-full border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-3 py-1 text-xs uppercase text-[#ffb4ab]">
                      {athlete.membershipLevel}
                    </span>
                  </div>
                ))}
                <Link href="/trainer-v2/assignments" className="block">
                  <PrimeChamferButton className="w-full">Asignar rutinas</PrimeChamferButton>
                </Link>
              </>
            ) : (
              <p className="gp-mono py-8 text-center text-sm gp-text-muted">
                Todos tus atletas tienen rutina activa
              </p>
            )}
          </div>
        </PrimeModule>

        <PrimeModule modId="TRN-03" title="MIS_ATLETAS">
          <div className="space-y-3 p-4 sm:p-5">
            {myAthletes.slice(0, 5).map((athlete) => {
              const assignment = getActiveAssignmentForAthlete(athlete.id);
              return (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between rounded border gp-border-outline/40 p-4"
                >
                  <div>
                    <p className="font-medium gp-text-primary">{athlete.name}</p>
                    <p className="gp-mono text-xs gp-text-muted">
                      {assignment
                        ? getRoutineName(assignment.routineId)
                        : 'Sin rutina'}
                    </p>
                  </div>
                </div>
              );
            })}
            {myAthletes.length === 0 ? (
              <p className="gp-mono py-8 text-center text-sm gp-text-muted">
                No tienes atletas asignados
              </p>
            ) : (
              <Link href="/trainer-v2/athletes" className="block">
                <PrimeChamferButton className="w-full">Ver todos</PrimeChamferButton>
              </Link>
            )}
          </div>
        </PrimeModule>
      </div>
    </div>
  );
}
