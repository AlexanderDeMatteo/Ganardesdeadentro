'use client';

import { AthleteProfile, Routine } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AssignRoutineModalProps {
  athlete: AthleteProfile | null;
  routines: Routine[];
  onAssign: (athleteId: string, routineId: string) => void;
  onClose: () => void;
}

export function AssignRoutineModal({ athlete, routines, onAssign, onClose }: AssignRoutineModalProps) {
  if (!athlete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-secondary/20 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary/20 px-6 py-4">
          <h2 className="text-lg font-bold">Asignar rutina</h2>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 px-6 py-6">
          <p className="text-sm text-muted-foreground">
            Atleta: <span className="font-medium text-foreground">{athlete.name}</span>
          </p>
          {routines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Crea una rutina primero en la sección Rutinas.</p>
          ) : (
            routines.map((routine) => (
              <button
                key={routine.id}
                type="button"
                onClick={() => {
                  onAssign(athlete.id, routine.id);
                  onClose();
                }}
                className="w-full rounded-lg border border-secondary/20 bg-secondary/5 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <p className="font-semibold text-foreground">{routine.name}</p>
                <p className="text-xs text-muted-foreground">
                  {routine.exercises.length} ejercicios · {routine.duration} min
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
