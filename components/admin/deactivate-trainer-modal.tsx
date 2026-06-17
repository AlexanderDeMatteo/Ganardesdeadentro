'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Athlete, Trainer } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { ScrollableModal } from '@/components/ui/scrollable-modal';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { cn } from '@/lib/utils';

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
  prime?: boolean;
}

export function DeactivateTrainerModal({
  trainer,
  athletes,
  otherTrainers,
  onConfirm,
  onClose,
  prime = false,
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

  const athleteCards = assignedAthletes.length > 0 && (
    <div
      className={cn(
        'space-y-3',
        prime && 'max-h-[min(40dvh,16rem)] overflow-y-auto pr-1',
      )}
    >
      {assignedAthletes.map((athlete) => {
        const actionState = actions.find((a) => a.athleteId === athlete.id);
        return (
          <div
            key={athlete.id}
            className={cn(
              'space-y-3 rounded-xl border p-4',
              prime ? 'gp-border-outline gp-bg-surface-high' : 'border-secondary/20',
            )}
          >
            <div>
              <p className={cn('font-medium', prime && 'gp-text-primary')}>{athlete.name}</p>
              <p className={cn('text-sm', prime ? 'gp-mono gp-text-muted' : 'text-muted-foreground')}>
                {athlete.email}
              </p>
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
                className={
                  prime && actionState?.action === 'reassign'
                    ? 'gp-mono bg-[var(--gp-phosphor)] text-[#003906]'
                    : prime
                      ? 'gp-mono gp-border-outline gp-text-muted'
                      : undefined
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
                className={
                  prime && actionState?.action === 'unassign'
                    ? 'gp-mono bg-[var(--gp-phosphor)] text-[#003906]'
                    : prime
                      ? 'gp-mono gp-border-outline gp-text-muted'
                      : undefined
                }
              >
                Dejar sin entrenador
              </Button>
            </div>
            {actionState?.action === 'reassign' && (
              <select
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm',
                  prime
                    ? 'gp-mono gp-border-outline gp-bg-surface-high gp-text-primary'
                    : 'border-secondary/30 bg-background',
                )}
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
  );

  const body = (
    <div className={prime ? 'space-y-4' : 'space-y-6'}>
      <p className={prime ? 'gp-mono gp-text-muted' : 'text-muted-foreground'}>
        Vas a desactivar a{' '}
        <span className={cn('font-semibold', prime ? 'gp-text-phosphor' : 'text-foreground')}>
          {trainer.name}
        </span>
        .
        {assignedAthletes.length > 0
          ? ' Indica qué hacer con sus atletas antes de confirmar.'
          : ' Este entrenador no tiene atletas asignados.'}
      </p>

      {error && (
        <p className={cn('text-sm', prime ? 'text-[#ffb4ab]' : 'text-destructive')} role="alert">
          {error}
        </p>
      )}

      {athleteCards}
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSubmitting}
        className={
          prime
            ? 'gp-mono gp-border-outline gp-bg-surface-high gp-text-muted hover:gp-text-phosphor'
            : undefined
        }
      >
        Cancelar
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={isSubmitting || !allResolved}
        onClick={handleConfirm}
        className={prime ? 'gp-mono' : undefined}
      >
        {isSubmitting ? 'Procesando...' : 'Confirmar baja'}
      </Button>
    </div>
  );

  if (prime) {
    return (
      <PrimeScrollableModal
        title="Eliminar entrenador"
        modId="22"
        onClose={onClose}
        footer={footer}
        size="wide"
        fitContent
      >
        {body}
      </PrimeScrollableModal>
    );
  }

  return (
    <ScrollableModal
      title="Eliminar entrenador"
      onClose={onClose}
      footer={footer}
      size="xl"
    >
      {body}
    </ScrollableModal>
  );
}
