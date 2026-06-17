'use client';

import type { Routine } from '@/hooks/use-admin';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimeSearchInput } from '@/components/admin-v2/prime-search-input';
import { cn } from '@/lib/utils';
import { Clock, Dumbbell, Edit2, Trash2 } from 'lucide-react';

const DIFFICULTY_LABEL: Record<Routine['difficulty'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  expert: 'Experto',
};

const DIFFICULTY_STYLE: Record<Routine['difficulty'], string> = {
  beginner: 'border-[var(--gp-phosphor)]/30 bg-[var(--gp-phosphor)]/10 gp-text-phosphor',
  intermediate: 'border-[#ffb74d]/30 bg-[#ffb74d]/10 text-[#ffb74d]',
  expert: 'border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]',
};

type PrimeRoutineCardProps = {
  routine: Routine;
  onEdit: () => void;
  onDelete: () => void;
};

export function PrimeRoutineCard({ routine, onEdit, onDelete }: PrimeRoutineCardProps) {
  return (
    <article className="gp-module rounded-lg border gp-border-outline p-4 transition-all hover:gp-phosphor-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="gp-display truncate text-base gp-text-primary">{routine.name}</h3>
          <p className="gp-mono mt-1 line-clamp-2 text-xs gp-text-muted">{routine.description}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded border gp-border-outline p-2 gp-text-muted hover:gp-text-phosphor"
            aria-label={`Editar rutina ${routine.name}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded border border-[#ffb4ab]/30 p-2 text-[#ffb4ab]/80 hover:text-[#ffb4ab]"
            aria-label={`Eliminar rutina ${routine.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="gp-mono flex items-center gap-1 text-xs gp-text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {routine.duration} min
        </span>
        <span className="gp-mono flex items-center gap-1 text-xs gp-text-muted">
          <Dumbbell className="h-3.5 w-3.5" aria-hidden />
          {routine.exercises.length} ejercicios
        </span>
        <span
          className={cn(
            'gp-mono rounded-full border px-2 py-0.5 text-[10px] uppercase',
            DIFFICULTY_STYLE[routine.difficulty],
          )}
        >
          {DIFFICULTY_LABEL[routine.difficulty]}
        </span>
      </div>
    </article>
  );
}

type PrimeRoutinesGridProps = {
  routines: Routine[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routineId: string) => void;
};

export function PrimeRoutinesGrid({
  routines,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: PrimeRoutinesGridProps) {
  return (
    <PrimeModule modId="31" title="INVENTARIO_RUTINAS">
      <div className="space-y-4 p-4 sm:p-5">
        <PrimeSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar rutina..."
          ariaLabel="Buscar rutinas"
        />
        {routines.length === 0 ? (
          <p className="gp-mono py-8 text-center text-sm gp-text-muted">Sin rutinas en este filtro</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {routines.map((routine) => (
              <PrimeRoutineCard
                key={routine.id}
                routine={routine}
                onEdit={() => onEdit(routine)}
                onDelete={() => onDelete(routine.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PrimeModule>
  );
}
