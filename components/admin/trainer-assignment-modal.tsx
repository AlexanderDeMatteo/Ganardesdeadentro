'use client';

import { AthleteProfile, Trainer } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { ScrollableModal } from '@/components/ui/scrollable-modal';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { Star, Users } from 'lucide-react';
import { useState } from 'react';

interface TrainerAssignmentModalProps {
  athlete: AthleteProfile | null;
  trainers: Trainer[];
  currentTrainerName?: string;
  onAssign: (trainerId: string) => void;
  onClose: () => void;
  /** Apply Gainer Prime visual skin (admin-v2) */
  prime?: boolean;
}

export function TrainerAssignmentModal({
  athlete,
  trainers,
  currentTrainerName,
  onAssign,
  onClose,
  prime = false,
}: TrainerAssignmentModalProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);

  if (!athlete) return null;

  const handleAssign = () => {
    if (selectedTrainerId) {
      onAssign(selectedTrainerId);
      onClose();
    }
  };

  const footer = prime ? (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={onClose}
        className="gp-mono gp-border-outline gp-bg-surface-high gp-text-muted hover:gp-text-phosphor"
      >
        Cancelar
      </Button>
      <Button
        onClick={handleAssign}
        disabled={!selectedTrainerId}
        className="gp-mono rounded-full bg-[var(--gp-phosphor)] font-bold text-[#003906] hover:bg-[var(--gp-phosphor-bright)] disabled:opacity-50"
      >
        Asignar Entrenador
      </Button>
    </div>
  ) : (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={onClose}
        className="border-secondary/30 text-secondary hover:bg-secondary/10"
      >
        Cancelar
      </Button>
      <Button
        onClick={handleAssign}
        disabled={!selectedTrainerId}
        className="bg-gradient-to-r from-primary to-secondary"
      >
        Asignar Entrenador
      </Button>
    </div>
  );

  const modalBody = (
    <div className={prime ? 'space-y-4' : 'space-y-6'}>
      <div
        className={
          prime
            ? 'rounded-lg border gp-border-outline gp-bg-surface-variant/40 p-4'
            : 'rounded-lg border border-secondary/20 bg-secondary/10 p-4'
        }
      >
        <p className={prime ? 'gp-mono mb-1 text-sm gp-text-dim' : 'mb-1 text-sm text-muted-foreground'}>
          Asignando entrenador a
        </p>
        <p className={prime ? 'gp-display text-xl gp-text-primary' : 'text-xl font-semibold text-foreground'}>
          {athlete.name}
        </p>
        {currentTrainerName && (
          <p className={prime ? 'gp-mono mt-1 text-sm gp-text-muted' : 'mt-1 text-sm text-muted-foreground'}>
            Entrenador actual:{' '}
            <span className={prime ? 'gp-text-phosphor' : 'font-medium'}>{currentTrainerName}</span>
          </p>
        )}
      </div>

      <div>
        <h3 className={prime ? 'gp-label gp-text-phosphor mb-3' : 'mb-4 text-lg font-semibold'}>
          Entrenadores Disponibles
        </h3>
        <div className="max-h-[min(40dvh,16rem)] space-y-3 overflow-y-auto pr-1">
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              onClick={() => setSelectedTrainerId(trainer.id)}
              className={
                prime
                  ? `cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                      selectedTrainerId === trainer.id
                        ? 'border-[var(--gp-phosphor)] gp-bg-surface-variant/60'
                        : 'gp-border-outline gp-bg-surface-high/50 hover:border-[var(--gp-phosphor)]/40'
                    }`
                  : `cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                      selectedTrainerId === trainer.id
                        ? 'border-primary bg-primary/10'
                        : 'border-secondary/20 bg-card/50 hover:border-secondary/40'
                    }`
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={prime ? 'gp-mono font-semibold gp-text-primary' : 'font-semibold text-foreground'}>
                    {trainer.name}
                  </p>
                  <p className={prime ? 'gp-mono mb-3 text-sm gp-text-muted' : 'mb-3 text-sm text-muted-foreground'}>
                    {trainer.specialization}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className={prime ? 'h-4 w-4 gp-text-phosphor' : 'h-4 w-4 text-secondary'} />
                      <span className={prime ? 'gp-mono text-sm gp-text-muted' : 'text-sm'}>
                        {trainer.athletes} atletas
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className={prime ? 'gp-metric text-sm font-medium gp-text-primary' : 'text-sm font-medium'}>
                        {trainer.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={
                    prime
                      ? `flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selectedTrainerId === trainer.id
                            ? 'border-[var(--gp-phosphor)] bg-[var(--gp-phosphor)]'
                            : 'gp-border-outline'
                        }`
                      : `flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selectedTrainerId === trainer.id
                            ? 'border-primary bg-primary'
                            : 'border-secondary/30'
                        }`
                  }
                >
                  {selectedTrainerId === trainer.id && (
                    <div className="h-3 w-3 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (prime) {
    return (
      <PrimeScrollableModal
        title="Asignar Entrenador"
        modId="41"
        onClose={onClose}
        footer={footer}
        size="wide"
        fitContent
      >
        {modalBody}
      </PrimeScrollableModal>
    );
  }

  return (
    <ScrollableModal title="Asignar Entrenador" onClose={onClose} footer={footer} size="wide">
      {modalBody}
    </ScrollableModal>
  );
}
