'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Athlete, Trainer } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type AthleteAction = {
  athleteId: string;
  action: 'reassign' | 'unassign' | '';
  newTrainerId?: string;
};

interface DeactivateTrainerModalProps {
  trainer: Trainer | null;
  athletes: Athlete[];
  otherTrainers: Trainer[];
  onConfirm: (
    athleteActions: Array<{
      athleteId: string;
      action: 'reassign' | 'unassign';
      newTrainerId?: string;
    }>,
  ) => Promise<void>;
  onClose: () => void;
}

export function DeactivateTrainerModal({
  trainer,
  athletes,
  otherTrainers,
  onConfirm,
  onClose,
}: DeactivateTrainerModalProps) {
  const assignedAthletes = useMemo(
    () => (trainer ? athletes.filter((a) => a.trainerId === trainer.id) : []),
    [athletes, trainer],
  );

  const assignedAthleteIdsKey = useMemo(
    () => assignedAthletes.map((a) => a.id).sort().join(','),
    [assignedAthletes],
  );

  const [actions, setActions] = useState<AthleteAction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedKeyRef = useRef('');

  useEffect(() => {
    if (!trainer) {
      initializedKeyRef.current = '';
      setActions([]);
      setError(null);
      return;
    }

    const initKey = `${trainer.id}|${assignedAthleteIdsKey}`;
    if (initializedKeyRef.current === initKey) {
      return;
    }

    initializedKeyRef.current = initKey;
    const ids = assignedAthleteIdsKey ? assignedAthleteIdsKey.split(',') : [];
    setActions(
      ids.map((athleteId) => ({
        athleteId,
        action: '' as const,
        newTrainerId: undefined,
      })),
    );
    setError(null);
  }, [trainer, assignedAthleteIdsKey]);

  if (!trainer) return null;

  const allResolved =
    assignedAthletes.length === 0 ||
    actions.every((a) => {
      if (a.action === 'unassign') return true;
      if (a.action === 'reassign') return Boolean(a.newTrainerId);
      return false;
    });

  const handleConfirm = async () => {
    if (!allResolved) {
      setError('Indica qué hacer con cada atleta asignado');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(
        actions.map((a) => ({
          athleteId: a.athleteId,
          action: a.action as 'reassign' | 'unassign',
          newTrainerId: a.action === 'reassign' ? a.newTrainerId : undefined,
        })),
      );
      onClose();
    } catch {
      setError('No se pudo desactivar el entrenador');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-secondary/20 bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-secondary/20 px-8 py-6">
          <h2 className="text-2xl font-bold">Eliminar entrenador</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 border-secondary/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-8 py-8 space-y-6">
          <p className="text-muted-foreground">
            Vas a desactivar a <span className="font-semibold text-foreground">{trainer.name}</span>.
            {assignedAthletes.length > 0
              ? ' Indica qué hacer con sus atletas antes de confirmar.'
              : ' Este entrenador no tiene atletas asignados.'}
          </p>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {assignedAthletes.length > 0 && (
            <div className="space-y-4">
              {assignedAthletes.map((athlete) => {
                const actionState = actions.find((a) => a.athleteId === athlete.id);
                return (
                  <div
                    key={athlete.id}
                    className="rounded-xl border border-secondary/20 p-4 space-y-3"
                  >
                    <div>
                      <p className="font-medium">{athlete.name}</p>
                      <p className="text-sm text-muted-foreground">{athlete.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={actionState?.action === 'reassign' ? 'default' : 'outline'}
                        onClick={() =>
                          setActions((prev) =>
                            prev.map((a) =>
                              a.athleteId === athlete.id
                                ? { ...a, action: 'reassign', newTrainerId: a.newTrainerId }
                                : a,
                            ),
                          )
                        }
                      >
                        Reasignar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={actionState?.action === 'unassign' ? 'default' : 'outline'}
                        onClick={() =>
                          setActions((prev) =>
                            prev.map((a) =>
                              a.athleteId === athlete.id
                                ? { ...a, action: 'unassign', newTrainerId: undefined }
                                : a,
                            ),
                          )
                        }
                      >
                        Dejar sin entrenador
                      </Button>
                    </div>
                    {actionState?.action === 'reassign' && (
                      <select
                        className="w-full rounded-lg border border-secondary/30 bg-background px-3 py-2 text-sm"
                        value={actionState.newTrainerId ?? ''}
                        onChange={(e) =>
                          setActions((prev) =>
                            prev.map((a) =>
                              a.athleteId === athlete.id
                                ? { ...a, newTrainerId: e.target.value }
                                : a,
                            ),
                          )
                        }
                      >
                        <option value="">Selecciona entrenador</option>
                        {otherTrainers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.specialization})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting || !allResolved}
              onClick={handleConfirm}
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar baja'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
