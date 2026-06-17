'use client';

import { AthleteProfile } from '@/hooks/use-admin';
import { Routine } from '@/lib/data/types';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { X } from 'lucide-react';

interface PrimeTrainerAssignRoutineModalProps {
  athlete: AthleteProfile | null;
  routines: Routine[];
  onAssign: (athleteId: string, routineId: string) => void;
  onClose: () => void;
}

export function PrimeTrainerAssignRoutineModal({
  athlete,
  routines,
  onAssign,
  onClose,
}: PrimeTrainerAssignRoutineModalProps) {
  if (!athlete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="gp-module gp-module-corner w-full max-w-md">
        <div className="flex items-center justify-between border-b gp-border-outline/40 px-6 py-4">
          <h2 className="gp-display text-lg gp-text-primary">Asignar rutina</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border gp-border-outline p-1.5 gp-text-muted transition-colors hover:gp-text-phosphor"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-6 py-6">
          <p className="gp-mono text-sm gp-text-muted">
            Atleta: <span className="gp-text-primary">{athlete.name}</span>
          </p>
          {routines.length === 0 ? (
            <p className="gp-mono text-sm gp-text-muted">
              Crea una rutina primero en la sección Rutinas.
            </p>
          ) : (
            routines.map((routine) => (
              <button
                key={routine.id}
                type="button"
                onClick={() => {
                  onAssign(athlete.id, routine.id);
                  onClose();
                }}
                className="w-full rounded border gp-border-outline/40 gp-bg-surface-variant/20 p-4 text-left transition-colors hover:border-[#68ca62]/40 hover:gp-bg-surface-variant/40"
              >
                <p className="font-semibold gp-text-primary">{routine.name}</p>
                <p className="gp-mono text-xs gp-text-muted">
                  {routine.exercises.length} ejercicios · {routine.duration} min
                </p>
              </button>
            ))
          )}
          <PrimeChamferButton onClick={onClose} className="w-full">
            Cancelar
          </PrimeChamferButton>
        </div>
      </div>
    </div>
  );
}
