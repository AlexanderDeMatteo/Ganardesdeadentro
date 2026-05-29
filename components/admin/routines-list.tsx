'use client';

import { useState } from 'react';
import { Routine } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock, Dumbbell, Trash2, Edit2 } from 'lucide-react';

interface RoutinesListProps {
  routines: Routine[];
  onDelete: (id: string) => void;
}

export function RoutinesList({ routines, onDelete }: RoutinesListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'expert':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted';
    }
  };

  const pendingRoutine = routines.find((r) => r.id === pendingDeleteId);

  return (
    <div className="space-y-4">
      {routines.map((routine) => (
        <div
          key={routine.id}
          className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm hover:border-secondary/40 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">{routine.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{routine.description}</p>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">{routine.duration} min</span>
                </div>

                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{routine.exercises.length} ejercicios</span>
                </div>

                <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${getDifficultyColor(routine.difficulty)} capitalize`}>
                  {routine.difficulty === 'beginner' && 'Principiante'}
                  {routine.difficulty === 'intermediate' && 'Intermedio'}
                  {routine.difficulty === 'expert' && 'Experto'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 border-secondary/30 hover:bg-secondary/10"
                aria-label={`Editar rutina ${routine.name}`}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingDeleteId(routine.id)}
                className="h-10 w-10 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                aria-label={`Eliminar rutina ${routine.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Ejercicios incluidos</p>
            <div className="space-y-2">
              {routine.exercises.slice(0, 3).map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{ex.exerciseName}</span>
                  <span className="text-muted-foreground text-xs">
                    {ex.sets}x{ex.reps} • {ex.rest}s
                  </span>
                </div>
              ))}
              {routine.exercises.length > 3 && (
                <div className="text-xs text-muted-foreground pt-2 border-t border-secondary/20">
                  +{routine.exercises.length - 3} ejercicios más
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {routines.length === 0 && (
        <EmptyState
          title="No hay rutinas creadas aún"
          description="Crea tu primera rutina para asignarla a tus atletas."
        />
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Eliminar rutina"
        description={
          pendingRoutine
            ? `¿Eliminar "${pendingRoutine.name}"? Esta acción no se puede deshacer.`
            : '¿Eliminar esta rutina? Esta acción no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (pendingDeleteId) {
            onDelete(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
      />
    </div>
  );
}
