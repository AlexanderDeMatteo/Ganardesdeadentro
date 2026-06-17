'use client';

import type { Trainer } from '@/hooks/use-admin';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimeSearchInput } from '@/components/admin-v2/prime-search-input';
import { getInitials } from '@/lib/admin-v2/get-initials';
import { cn } from '@/lib/utils';
import { Mail, Star, Users } from 'lucide-react';

type TrainerStatus = 'active' | 'pending' | 'inactive';

function getTrainerStatus(trainer: Trainer): TrainerStatus {
  if (trainer.invitePending) return 'pending';
  if (trainer.isActive === false) return 'inactive';
  return 'active';
}

const STATUS_DOT: Record<TrainerStatus, string> = {
  active: 'bg-[var(--gp-phosphor-core)] gp-pulse-hardware',
  pending: 'bg-[#ffb74d]',
  inactive: 'bg-[#ffb4ab]',
};

type PrimeTrainerCardProps = {
  trainer: Trainer;
  selected: boolean;
  onSelect: () => void;
};

export function PrimeTrainerCard({ trainer, selected, onSelect }: PrimeTrainerCardProps) {
  const status = getTrainerStatus(trainer);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'gp-module relative flex min-h-[200px] w-full flex-col overflow-hidden rounded-lg border text-left transition-all',
        'hover:gp-phosphor-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gp-phosphor)]',
        selected ? 'border-[var(--gp-phosphor)]/60 gp-phosphor-glow' : 'gp-border-outline',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--gp-phosphor)]/8 via-transparent to-[#0d1511]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div
              className={cn(
                'gp-chamfer flex h-14 w-14 items-center justify-center',
                'border border-[#255831] bg-[#0d1511]/90',
              )}
            >
              <span className="gp-mono text-base font-bold gp-text-phosphor">
                {getInitials(trainer.name)}
              </span>
            </div>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d1511]',
                STATUS_DOT[status],
              )}
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="gp-mono text-[10px] uppercase tracking-wider gp-text-dim">
              {trainer.specialization}
            </p>
            <h3 className="gp-display mt-1 truncate text-lg gp-text-primary">{trainer.name}</h3>
            <p className="gp-mono mt-1 truncate text-xs gp-text-muted">{trainer.email}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto border-t gp-border-outline/40 bg-[#0d1511]/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-3">
            <span className="gp-mono flex items-center gap-1 text-xs gp-text-muted">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {trainer.athletes} atletas
            </span>
            <span className="gp-mono flex items-center gap-1 text-xs gp-text-muted">
              <Star className="h-3.5 w-3.5" aria-hidden />
              {trainer.rating.toFixed(1)}
            </span>
          </div>
          {status === 'pending' && (
            <span className="gp-mono shrink-0 rounded-full border border-[#ffb74d]/40 bg-[#ffb74d]/10 px-2 py-0.5 text-[10px] uppercase text-[#ffb74d]">
              Pendiente
            </span>
          )}
          {status === 'inactive' && (
            <span className="gp-mono shrink-0 rounded-full border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-2 py-0.5 text-[10px] uppercase text-[#ffb4ab]">
              Inactivo
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

type PrimeTrainersGridProps = {
  trainers: Trainer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function PrimeTrainersGrid({
  trainers,
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: PrimeTrainersGridProps) {
  return (
    <PrimeModule modId="21" title="PLANTILLA_ENTRENADORES" className="min-w-0 flex-1 overflow-hidden">
      <div className="space-y-4 p-4 sm:p-5">
        <PrimeSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar por nombre o email..."
          ariaLabel="Buscar entrenadores"
        />
        {trainers.length === 0 ? (
          <p className="gp-mono py-8 text-center text-sm gp-text-muted">Sin entrenadores en este filtro</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {trainers.map((trainer) => (
              <PrimeTrainerCard
                key={trainer.id}
                trainer={trainer}
                selected={selectedId === trainer.id}
                onSelect={() => onSelect(trainer.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PrimeModule>
  );
}
