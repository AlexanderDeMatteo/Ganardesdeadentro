'use client';

import type { AthleteProfile, Trainer } from '@/hooks/use-admin';
import { PrimeMembershipBadge } from '@/components/admin-v2/prime-membership-badge';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimeProgressSegments } from '@/components/admin-v2/prime-progress-segments';
import { cn } from '@/lib/utils';
import { Link2, UserMinus } from 'lucide-react';

type PrimeTrainerWorkloadBlockProps = {
  trainer: Trainer;
  assignedAthletes: AthleteProfile[];
  capacityDraft: string;
  onCapacityChange: (value: string) => void;
  onSaveCapacity: () => void;
  isSavingCapacity: boolean;
  onReassign: (athlete: AthleteProfile) => void;
  onUnassign: (athlete: AthleteProfile) => void;
  isAssigning: boolean;
};

export function PrimeTrainerWorkloadBlock({
  trainer,
  assignedAthletes,
  capacityDraft,
  onCapacityChange,
  onSaveCapacity,
  isSavingCapacity,
  onReassign,
  onUnassign,
  isAssigning,
}: PrimeTrainerWorkloadBlockProps) {
  const capacity = trainer.maxAthletes ?? 10;
  const percentage = Math.min(100, (assignedAthletes.length / capacity) * 100);

  return (
    <PrimeModule modId="43" title={`CARGA // ${trainer.name.toUpperCase()}`}>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="gp-mono text-xs gp-text-dim">{trainer.specialization}</p>
            <p className="gp-metric mt-1 text-2xl gp-text-phosphor">
              {assignedAthletes.length}
              <span className="gp-mono ml-1 text-sm gp-text-muted">/ {capacity}</span>
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label
                htmlFor={`capacity-${trainer.id}`}
                className="gp-mono mb-1 block text-[10px] uppercase gp-text-dim"
              >
                Capacidad máx.
              </label>
              <input
                id={`capacity-${trainer.id}`}
                type="number"
                min={1}
                max={100}
                value={capacityDraft}
                onChange={(e) => onCapacityChange(e.target.value)}
                className="gp-mono h-9 w-20 rounded border gp-border-outline gp-bg-surface-high px-2 text-sm gp-text-primary"
              />
            </div>
            <button
              type="button"
              onClick={onSaveCapacity}
              disabled={isSavingCapacity}
              className="gp-mono rounded border gp-border-outline px-3 py-2 text-xs gp-text-muted transition-colors hover:gp-text-phosphor disabled:opacity-50"
            >
              {isSavingCapacity ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        <div>
          <PrimeProgressSegments value={percentage} />
          <p
            className={cn(
              'gp-mono mt-2 text-xs',
              percentage >= 80 ? 'text-[#ffb4ab]' : percentage >= 60 ? 'text-[#ffb74d]' : 'gp-text-muted',
            )}
          >
            {Math.round(percentage)}% de capacidad
          </p>
        </div>

        {assignedAthletes.length > 0 ? (
          <div className="space-y-2">
            {assignedAthletes.map((athlete) => (
              <div
                key={athlete.id}
                className="flex flex-col gap-2 rounded-lg border gp-border-outline/40 bg-[#0d1511] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="gp-mono text-sm gp-text-primary">{athlete.name}</p>
                  <p className="gp-mono text-xs gp-text-dim">{athlete.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PrimeMembershipBadge level={athlete.membershipLevel} />
                  <button
                    type="button"
                    onClick={() => onReassign(athlete)}
                    disabled={isAssigning}
                    className="gp-mono flex items-center gap-1 rounded border gp-border-outline px-2 py-1 text-xs gp-text-muted hover:gp-text-phosphor disabled:opacity-50"
                  >
                    <Link2 className="h-3 w-3" aria-hidden />
                    Reasignar
                  </button>
                  <button
                    type="button"
                    onClick={() => onUnassign(athlete)}
                    disabled={isAssigning}
                    className="gp-mono flex items-center gap-1 rounded border border-[#ffb4ab]/30 px-2 py-1 text-xs text-[#ffb4ab]/80 hover:text-[#ffb4ab] disabled:opacity-50"
                  >
                    <UserMinus className="h-3 w-3" aria-hidden />
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="gp-mono py-4 text-center text-sm gp-text-muted">Sin atletas asignados</p>
        )}
      </div>
    </PrimeModule>
  );
}

type PrimeAssignmentMatrixProps = {
  trainers: Trainer[];
  assignmentMap: Record<string, AthleteProfile[]>;
  capacityDrafts: Record<string, string>;
  onCapacityChange: (trainerId: string, value: string) => void;
  onSaveCapacity: (trainerId: string, fallback: number) => void;
  savingCapacityId: string | null;
  onReassign: (athlete: AthleteProfile) => void;
  onUnassign: (athlete: AthleteProfile) => void;
  isAssigning: boolean;
};

export function PrimeAssignmentMatrix({
  trainers,
  assignmentMap,
  capacityDrafts,
  onCapacityChange,
  onSaveCapacity,
  savingCapacityId,
  onReassign,
  onUnassign,
  isAssigning,
}: PrimeAssignmentMatrixProps) {
  return (
    <PrimeModule modId="41" title="MATRIZ_ASIGNACIÓN">
      <div className="space-y-4 p-4 sm:p-5">
        {trainers.length === 0 ? (
          <p className="gp-mono py-8 text-center text-sm gp-text-muted">
            No hay entrenadores activos disponibles
          </p>
        ) : (
          trainers.map((trainer) => {
            const assignedAthletes = assignmentMap[trainer.id] ?? [];
            const capacity = trainer.maxAthletes ?? 10;
            return (
              <PrimeTrainerWorkloadBlock
                key={trainer.id}
                trainer={trainer}
                assignedAthletes={assignedAthletes}
                capacityDraft={capacityDrafts[trainer.id] ?? String(capacity)}
                onCapacityChange={(v) => onCapacityChange(trainer.id, v)}
                onSaveCapacity={() => onSaveCapacity(trainer.id, capacity)}
                isSavingCapacity={savingCapacityId === trainer.id}
                onReassign={onReassign}
                onUnassign={onUnassign}
                isAssigning={isAssigning}
              />
            );
          })
        )}
      </div>
    </PrimeModule>
  );
}
