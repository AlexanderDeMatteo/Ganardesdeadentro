'use client';

import { Trainer } from '@/hooks/use-admin';
import { Star, Users, Calendar, Mail, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrainersListProps {
  trainers: Trainer[];
  onInviteResend?: (trainer: Trainer) => void;
  onDeactivate?: (trainer: Trainer) => void;
  onReactivate?: (trainer: Trainer) => void;
  isResendingId?: string | null;
  isReactivatingId?: string | null;
}

export function TrainersList({
  trainers,
  onInviteResend,
  onDeactivate,
  onReactivate,
  isResendingId,
  isReactivatingId,
}: TrainersListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {trainers.map((trainer) => {
        const isInactive = trainer.isActive === false && !trainer.invitePending;
        const isPending = trainer.invitePending === true;

        return (
          <div
            key={trainer.id}
            className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm hover:border-secondary/40 hover:shadow-lg transition-all duration-300"
          >
            <div className="mb-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-lg font-bold text-foreground">{trainer.name}</h3>
                <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-3 py-1 shrink-0">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-semibold">{trainer.rating}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{trainer.specialization}</p>
              <div className="flex flex-wrap gap-2">
                {isPending && (
                  <span className="rounded-full bg-amber-500/15 text-amber-600 px-3 py-1 text-xs font-semibold">
                    Pendiente activación
                  </span>
                )}
                {isInactive && (
                  <span className="rounded-full bg-muted text-muted-foreground px-3 py-1 text-xs font-semibold">
                    Inactivo
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" />
                <span className="text-sm">
                  <span className="font-semibold">{trainer.athletes}</span> atletas asignados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Desde {new Date(trainer.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-secondary/20 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{trainer.email}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {isPending && onInviteResend && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isResendingId === trainer.id}
                    onClick={() => onInviteResend(trainer)}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {isResendingId === trainer.id ? 'Reenviando...' : 'Reenviar invitación'}
                  </Button>
                )}
                {isInactive && onReactivate && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isReactivatingId === trainer.id}
                    onClick={() => onReactivate(trainer)}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {isReactivatingId === trainer.id ? 'Reactivando…' : 'Reactivar'}
                  </Button>
                )}
                {!isInactive && !isPending && onDeactivate && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onDeactivate(trainer)}
                    className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
