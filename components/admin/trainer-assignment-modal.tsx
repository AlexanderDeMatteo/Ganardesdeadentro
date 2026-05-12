'use client';

import { AthleteProfile, Trainer } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { X, Star, Users } from 'lucide-react';
import { useState } from 'react';

interface TrainerAssignmentModalProps {
  athlete: AthleteProfile | null;
  trainers: Trainer[];
  onAssign: (trainerId: string) => void;
  onClose: () => void;
}

export function TrainerAssignmentModal({
  athlete,
  trainers,
  onAssign,
  onClose,
}: TrainerAssignmentModalProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);

  if (!athlete) return null;

  const handleAssign = () => {
    if (selectedTrainerId) {
      onAssign(selectedTrainerId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-secondary/20 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary/20 px-8 py-6">
          <h2 className="text-2xl font-bold">Asignar Entrenador</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 border-secondary/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-8 py-8 space-y-6">
          <div className="rounded-lg bg-secondary/10 p-4 border border-secondary/20">
            <p className="text-sm text-muted-foreground mb-1">Asignando entrenador a</p>
            <p className="text-xl font-semibold text-foreground">{athlete.name}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Entrenadores Disponibles</h3>
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  onClick={() => setSelectedTrainerId(trainer.id)}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                    selectedTrainerId === trainer.id
                      ? 'border-primary bg-primary/10'
                      : 'border-secondary/20 bg-card/50 hover:border-secondary/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{trainer.name}</p>
                      <p className="text-sm text-muted-foreground mb-3">{trainer.specialization}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-secondary" />
                          <span className="text-sm">{trainer.athletes} atletas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{trainer.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                      selectedTrainerId === trainer.id
                        ? 'border-primary bg-primary'
                        : 'border-secondary/30'
                    }`}>
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

        <div className="border-t border-secondary/20 px-8 py-4 flex justify-end gap-3">
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
      </div>
    </div>
  );
}
