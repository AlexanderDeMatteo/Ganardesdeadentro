'use client';

import { AthleteProfile } from '@/hooks/use-admin';
import { RoutineAssignment } from '@/hooks/use-trainer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trash2, User } from 'lucide-react';

interface AssignmentBoardProps {
  athletes: AthleteProfile[];
  assignments: RoutineAssignment[];
  getRoutineName: (routineId: string) => string;
  onUnassign: (assignmentId: string) => void;
  onToggleComplete: (assignmentId: string) => void;
  onAssignClick: (athlete: AthleteProfile) => void;
}

export function AssignmentBoard({
  athletes,
  assignments,
  getRoutineName,
  onUnassign,
  onToggleComplete,
  onAssignClick,
}: AssignmentBoardProps) {
  return (
    <div className="space-y-6">
      {athletes.map((athlete) => {
        const athleteAssignments = assignments.filter((a) => a.athleteId === athlete.id);
        const active = athleteAssignments.find((a) => a.isActive);

        return (
          <div
            key={athlete.id}
            className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{athlete.name}</p>
                  <p className="text-sm text-muted-foreground">{athlete.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onAssignClick(athlete)}>
                {active ? 'Cambiar rutina' : 'Asignar rutina'}
              </Button>
            </div>

            {athleteAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin rutinas asignadas</p>
            ) : (
              <ul className="space-y-2">
                {athleteAssignments.map((assignment) => (
                  <li
                    key={assignment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-secondary/15 bg-secondary/5 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{getRoutineName(assignment.routineId)}</p>
                      <p className="text-xs text-muted-foreground">
                        Desde {assignment.assignedDate}
                        {assignment.isActive ? ' · Activa' : ' · Completada'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleComplete(assignment.id)}
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {assignment.isActive ? 'Completar' : 'Reactivar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUnassign(assignment.id)}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {athletes.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No tienes atletas asignados</p>
      )}
    </div>
  );
}
