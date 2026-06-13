'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { TrainersList } from '@/components/admin/trainers-list';
import { CreateTrainerModal } from '@/components/admin/create-trainer-modal';
import { DeactivateTrainerModal } from '@/components/admin/deactivate-trainer-modal';
import { useAdmin, Trainer } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export default function TrainersPage() {
  const {
    athletes,
    trainers,
    createTrainer,
    deactivateTrainer,
    reactivateTrainer,
    resendTrainerInvite,
  } = useAdmin();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Trainer | null>(null);
  const [isResendingId, setIsResendingId] = useState<string | null>(null);
  const [isReactivatingId, setIsReactivatingId] = useState<string | null>(null);

  const visibleTrainers = trainers.filter(
    (t) => t.isActive !== false || t.invitePending,
  );
  const activeTrainers = visibleTrainers.filter((t) => t.isActive !== false && !t.invitePending);

  const handleCreate = async (payload: {
    email: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  }) => {
    await createTrainer(payload);
    toast.success(`Invitación enviada a ${payload.email}`);
  };

  const handleResend = async (trainer: Trainer) => {
    setIsResendingId(trainer.id);
    try {
      await resendTrainerInvite(trainer.id);
      toast.success('Invitación reenviada');
    } catch {
      toast.error('No se pudo reenviar la invitación');
    } finally {
      setIsResendingId(null);
    }
  };

  const handleDeactivate = async (
    athleteActions: Array<{
      athleteId: string;
      action: 'reassign' | 'unassign';
      newTrainerId?: string;
    }>,
  ) => {
    if (!deactivateTarget) return;
    await deactivateTrainer(deactivateTarget.id, athleteActions);
    toast.success('Entrenador desactivado');
    setDeactivateTarget(null);
  };

  const handleReactivate = async (trainer: Trainer) => {
    setIsReactivatingId(trainer.id);
    try {
      await reactivateTrainer(trainer.id);
      toast.success('Entrenador reactivado');
    } catch {
      toast.error('No se pudo reactivar el entrenador');
    } finally {
      setIsReactivatingId(null);
    }
  };

  return (
    <div className="px-8 py-12 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-tight mb-2">Gestión de Entrenadores</h1>
          <p className="text-lg text-muted-foreground">
            Invita entrenadores, gestiona su estado y supervisa su carga de trabajo
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 bg-gradient-to-r from-primary to-secondary"
        >
          <UserPlus className="h-4 w-4" />
          Invitar entrenador
        </Button>
      </div>

      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Entrenadores activos</p>
            <p className="text-4xl font-bold text-primary">{activeTrainers.length}</p>
          </div>

          <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Atletas Asignados</p>
            <p className="text-4xl font-bold text-secondary">
              {activeTrainers.reduce((sum, t) => sum + t.athletes, 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Rating Promedio</p>
            <p className="text-4xl font-bold text-accent">
              {activeTrainers.length > 0
                ? (
                    activeTrainers.reduce((sum, t) => sum + t.rating, 0) / activeTrainers.length
                  ).toFixed(1)
                : '0.0'}
            </p>
          </div>
        </div>

        <TrainersList
          trainers={visibleTrainers}
          onInviteResend={handleResend}
          onDeactivate={setDeactivateTarget}
          onReactivate={handleReactivate}
          isResendingId={isResendingId}
          isReactivatingId={isReactivatingId}
        />
      </div>

      <CreateTrainerModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <DeactivateTrainerModal
        trainer={deactivateTarget}
        athletes={athletes}
        otherTrainers={activeTrainers.filter((t) => t.id !== deactivateTarget?.id)}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
