'use client';

import { AthleteProfile } from '@/hooks/use-admin';
import { RoutineAssignment } from '@/hooks/use-trainer';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { CheckCircle2, ChevronDown, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

interface PrimeTrainerAssignmentBoardProps {
  athletes: AthleteProfile[];
  assignments: RoutineAssignment[];
  getRoutineName: (routineId: string) => string;
  onUnassign: (assignmentId: string) => void;
  onToggleComplete: (assignmentId: string) => void;
  onAssignClick: (athlete: AthleteProfile) => void;
}

export function PrimeTrainerAssignmentBoard({
  athletes,
  assignments,
  getRoutineName,
  onUnassign,
  onToggleComplete,
  onAssignClick,
}: PrimeTrainerAssignmentBoardProps) {
  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.isActive),
    [assignments],
  );
  const historyAssignments = useMemo(
    () => assignments.filter((assignment) => !assignment.isActive),
    [assignments],
  );

  const handleUnassign = (assignment: RoutineAssignment) => {
    const routineName = getRoutineName(assignment.routineId);
    const confirmed = window.confirm(
      `¿Desasignar la rutina "${routineName}" de esta asignación directa activa?`,
    );
    if (!confirmed) return;
    onUnassign(assignment.id);
  };

  if (athletes.length === 0) {
    return (
      <PrimeModule modId="TRN-51" title="ASIGNACIONES_DIRECTAS">
        <p className="gp-mono py-12 text-center text-sm gp-text-muted">
          No tienes atletas asignados
        </p>
      </PrimeModule>
    );
  }

  return (
    <PrimeModule modId="TRN-51" title="ASIGNACIONES_DIRECTAS">
      <div className="space-y-5 p-4 sm:p-5">
        <p className="gp-mono text-sm gp-text-muted">
          El atleta entrena según el plan semanal. Las asignaciones directas son puntuales y
          opcionales.
        </p>

        <section className="space-y-3" aria-label="Asignaciones directas activas">
          <h3 className="gp-mono text-xs uppercase gp-text-muted">Activas</h3>
          {activeAssignments.length === 0 ? (
            <p className="gp-mono text-sm gp-text-muted">No hay asignaciones directas activas.</p>
          ) : (
            <ul className="space-y-2">
              {activeAssignments.map((assignment) => {
                const athlete = athletes.find((item) => item.id === assignment.athleteId);
                return (
                  <li
                    key={assignment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border gp-border-outline/30 gp-bg-surface-variant/20 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium gp-text-primary">
                        {athlete?.name ?? 'Atleta'} · {getRoutineName(assignment.routineId)}
                      </p>
                      <p className="gp-mono text-xs gp-text-muted">
                        Desde {assignment.assignedDate} · Activa
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleComplete(assignment.id)}
                        className="gp-mono inline-flex items-center gap-1 rounded border gp-border-outline px-3 py-1.5 text-xs uppercase gp-text-muted transition-colors hover:gp-text-phosphor"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Completar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnassign(assignment)}
                        className="gp-mono inline-flex items-center gap-1 rounded border border-[#ffb4ab]/40 px-3 py-1.5 text-xs uppercase text-[#ffb4ab] transition-colors hover:bg-[#ffb4ab]/10"
                        aria-label="Desasignar rutina activa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <details className="group rounded border gp-border-outline/30 gp-bg-surface-variant/10">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 gp-mono text-sm font-medium gp-text-primary [&::-webkit-details-marker]:hidden">
            <span>Historial de asignaciones directas</span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 gp-text-muted" />
          </summary>
          <div className="space-y-4 border-t gp-border-outline/20 px-4 py-4">
            <p className="gp-mono text-xs gp-text-muted">
              El atleta entrena según el plan semanal. Estas entradas son asignaciones puntuales
              antiguas (solo lectura).
            </p>

            {historyAssignments.length === 0 ? (
              <p className="gp-mono text-sm gp-text-muted">Sin historial de asignaciones.</p>
            ) : (
              <ul className="space-y-2">
                {historyAssignments.map((assignment) => {
                  const athlete = athletes.find((item) => item.id === assignment.athleteId);
                  return (
                    <li
                      key={assignment.id}
                      className="rounded border gp-border-outline/20 gp-bg-surface-variant/10 px-4 py-3"
                    >
                      <p className="font-medium gp-text-primary">
                        {athlete?.name ?? 'Atleta'} · {getRoutineName(assignment.routineId)}
                      </p>
                      <p className="gp-mono text-xs gp-text-muted">
                        Desde {assignment.assignedDate} · Completada o inactiva
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            <section className="space-y-3 border-t gp-border-outline/20 pt-4">
              <h4 className="gp-mono text-xs uppercase gp-text-muted">
                Asignación directa (avanzado)
              </h4>
              <p className="gp-mono text-xs gp-text-muted">
                Usa esto solo si necesitas una rutina puntual fuera del plan semanal.
              </p>
              <ul className="space-y-2">
                {athletes.map((athlete) => {
                  const active = activeAssignments.find((item) => item.athleteId === athlete.id);
                  return (
                    <li
                      key={athlete.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border gp-border-outline/20 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium gp-text-primary">{athlete.name}</p>
                        <p className="gp-mono text-xs gp-text-muted">{athlete.email}</p>
                      </div>
                      <PrimeChamferButton type="button" onClick={() => onAssignClick(athlete)}>
                        {active ? 'Cambiar rutina directa' : 'Asignar rutina directa'}
                      </PrimeChamferButton>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </details>
      </div>
    </PrimeModule>
  );
}
