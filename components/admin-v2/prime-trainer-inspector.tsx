'use client';

import type { Trainer } from '@/hooks/use-admin';
import { PrimeInspectorCta } from '@/components/admin-v2/prime-inspector-cta';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { getInitials } from '@/lib/admin-v2/get-initials';
import { cn } from '@/lib/utils';
import { Mail, RotateCcw, Star, UserX, Users } from 'lucide-react';

type TrainerStatus = 'active' | 'pending' | 'inactive';

function getTrainerStatus(trainer: Trainer): TrainerStatus {
  if (trainer.invitePending) return 'pending';
  if (trainer.isActive === false) return 'inactive';
  return 'active';
}

const STATUS_LABEL: Record<TrainerStatus, string> = {
  active: '• Activo',
  pending: '• Pendiente activación',
  inactive: '• Inactivo',
};

type PrimeTrainerInspectorProps = {
  trainer: Trainer;
  onResendInvite: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  isResending: boolean;
  isReactivating: boolean;
};

export function PrimeTrainerInspector({
  trainer,
  onResendInvite,
  onDeactivate,
  onReactivate,
  isResending,
  isReactivating,
}: PrimeTrainerInspectorProps) {
  const status = getTrainerStatus(trainer);

  return (
    <PrimeModule modId="22" title="INSPECTOR_ENTRENADOR" className="flex h-full flex-col">
      <div className="flex items-start gap-4 border-b gp-border-outline/40 p-4">
        <div className="relative shrink-0">
          <div
            className={cn(
              'gp-chamfer flex h-16 w-16 items-center justify-center',
              'border border-[#255831] bg-[#0d1511]',
            )}
          >
            <span className="gp-mono text-lg font-bold gp-text-phosphor">
              {getInitials(trainer.name)}
            </span>
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d1511]',
              status === 'active' && 'bg-[var(--gp-phosphor-core)] gp-pulse-hardware',
              status === 'pending' && 'bg-[#ffb74d]',
              status === 'inactive' && 'bg-[#ffb4ab]',
            )}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="gp-display truncate text-lg gp-text-primary">{trainer.name}</h3>
          <p className="gp-mono mt-1 text-xs gp-text-muted">ID // {trainer.id.slice(0, 8)}</p>
          <p className="gp-mono mt-2 text-[10px] uppercase tracking-wider gp-text-dim">
            {STATUS_LABEL[status]}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <section>
          <p className="gp-label mb-2 gp-text-phosphor">Contacto</p>
          <dl className="space-y-2">
            <div className="flex justify-between gap-2">
              <dt className="gp-mono text-xs uppercase gp-text-dim">Email</dt>
              <dd className="gp-mono text-right text-sm normal-case text-gray-300">{trainer.email}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="gp-mono text-xs uppercase gp-text-dim">Especialización</dt>
              <dd className="gp-mono text-right text-sm gp-text-primary">{trainer.specialization}</dd>
            </div>
          </dl>
        </section>

        <section>
          <p className="gp-label mb-2 gp-text-phosphor">Métricas</p>
          <div className="grid grid-cols-2 gap-2 rounded-lg border gp-border-outline bg-[#0d1511] p-2">
            <div className="flex flex-col gap-1 rounded border gp-border-outline/40 p-3">
              <span className="gp-label gp-text-dim">Atletas</span>
              <span className="gp-metric text-sm gp-text-primary">{trainer.athletes}</span>
            </div>
            <div className="flex flex-col gap-1 rounded border gp-border-outline/40 p-3">
              <span className="gp-label gp-text-dim">Rating</span>
              <span className="gp-metric flex items-center gap-1 text-sm gp-text-primary">
                <Star className="h-3.5 w-3.5 gp-text-phosphor" aria-hidden />
                {trainer.rating.toFixed(1)}
              </span>
            </div>
            <div className="col-span-2 flex flex-col gap-1 rounded border gp-border-outline/40 p-3">
              <span className="gp-label gp-text-dim">Capacidad máx.</span>
              <span className="gp-mono text-sm gp-text-primary">{trainer.maxAthletes ?? 10} atletas</span>
            </div>
          </div>
        </section>
      </div>

      <footer className="grid grid-cols-1 gap-2 border-t gp-border-outline p-4">
        {status === 'pending' && (
          <PrimeInspectorCta onClick={onResendInvite}>
            <Mail className="h-4 w-4" aria-hidden />
            {isResending ? 'Reenviando...' : 'Reenviar invitación'}
          </PrimeInspectorCta>
        )}
        {status === 'inactive' ? (
          <PrimeInspectorCta onClick={onReactivate}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {isReactivating ? 'Reactivando...' : 'Reactivar entrenador'}
          </PrimeInspectorCta>
        ) : status !== 'pending' ? (
          <PrimeInspectorCta onClick={onDeactivate}>
            <UserX className="h-4 w-4" aria-hidden />
            Desactivar
          </PrimeInspectorCta>
        ) : (
          <PrimeInspectorCta onClick={onDeactivate}>
            <UserX className="h-4 w-4" aria-hidden />
            Cancelar invitación
          </PrimeInspectorCta>
        )}
      </footer>
    </PrimeModule>
  );
}
