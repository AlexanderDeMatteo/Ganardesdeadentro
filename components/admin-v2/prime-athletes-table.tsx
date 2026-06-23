'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { AthleteProfile } from '@/hooks/use-admin';
import type { Trainer } from '@/lib/data/types';
import type { AthleteRoutineSummary } from '@/lib/workout/athlete-routine-label';
import { PrimeMembershipBadge } from '@/components/admin-v2/prime-membership-badge';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePaginationBar } from '@/components/admin-v2/prime-pagination-bar';
import { PrimeSearchInput } from '@/components/admin-v2/prime-search-input';
import { PrimeTableRowAction } from '@/components/admin-v2/prime-table-row-action';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { findPageForItemId, paginateList } from '@/lib/admin-v2/paginate-list';
import { cn } from '@/lib/utils';
import { Dumbbell, Eye, Link2, MoreHorizontal, UtensilsCrossed } from 'lucide-react';

type PrimeAthletesTableProps = {
  athletes: AthleteProfile[];
  selectedId: string | null;
  onSelectRow: (id: string) => void;
  getTrainerById?: (id: string) => Trainer | undefined;
  getRoutineLabel?: (athleteId: string) => string;
  getAthleteRoutineSummary?: (athleteId: string) => AthleteRoutineSummary;
  mode?: 'admin' | 'trainer';
  nutritionBasePath?: string;
  onViewPerformance: (athlete: AthleteProfile) => void;
  onAssignTrainer?: (athlete: AthleteProfile) => void;
};

export function PrimeAthletesTable({
  athletes,
  selectedId,
  onSelectRow,
  getTrainerById,
  getRoutineLabel,
  getAthleteRoutineSummary,
  mode = 'admin',
  nutritionBasePath = '/admin-v2/athletes',
  onViewPerformance,
  onAssignTrainer,
}: PrimeAthletesTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }, [athletes, search]);

  useEffect(() => {
    setPage(1);
  }, [search, athletes]);

  useEffect(() => {
    if (!selectedId) return;
    const targetPage = findPageForItemId(filtered, selectedId);
    setPage(targetPage);
  }, [selectedId, filtered]);

  const paginated = useMemo(
    () => paginateList(filtered, page),
    [filtered, page],
  );

  useEffect(() => {
    if (page !== paginated.page) {
      setPage(paginated.page);
    }
  }, [page, paginated.page]);

  return (
    <PrimeModule modId={mode === 'trainer' ? 'TRN-11' : '11'} title="REGISTRO_ATLETAS" className="min-w-0">
      <div className="flex flex-col">
        <div className="space-y-4 p-4 sm:p-5">
          <PrimeSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o email..."
            ariaLabel="Buscar atletas por nombre o email"
          />

          <div className="hidden overflow-x-auto gp-scroll-thin md:block">
            <table
              className="w-full table-fixed border-collapse text-left"
              aria-label="Listado de atletas"
            >
              <caption className="sr-only">Atletas registrados en la plataforma</caption>
              <thead>
                <tr className="gp-mono border-b gp-border-outline gp-bg-surface-variant/30 text-xs uppercase gp-text-muted">
                  <th scope="col" className="w-[26%] p-3 font-medium sm:p-4">
                    Nombre
                  </th>
                  <th scope="col" className="hidden w-[28%] p-3 font-medium md:table-cell sm:p-4">
                    Email
                  </th>
                  <th scope="col" className="w-[16%] p-3 font-medium sm:p-4">
                    Membresía
                  </th>
                  <th scope="col" className="w-[22%] p-3 font-medium sm:p-4">
                    {mode === 'trainer' ? 'Rutina activa' : 'Entrenador'}
                  </th>
                  <th scope="col" className="w-[8.5rem] p-3 pr-4 text-center font-medium sm:p-4 sm:pr-5">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="gp-mono text-sm">
                {paginated.items.map((athlete) => {
                  const trainer =
                    mode === 'admin' && getTrainerById && athlete.trainerId
                      ? getTrainerById(athlete.trainerId)
                      : undefined;
                  const isSelected = selectedId === athlete.id;
                  const routineSummary = getAthleteRoutineSummary?.(athlete.id);

                  return (
                    <tr
                      key={athlete.id}
                      className={cn(
                        'gp-table-row cursor-pointer border-b gp-border-outline/20 transition-colors hover:gp-bg-surface-variant/20 focus-within:gp-bg-surface-variant/20',
                        isSelected && 'gp-table-row-active',
                      )}
                      onClick={() => onSelectRow(athlete.id)}
                    >
                      <td className="truncate p-3 font-medium gp-text-primary sm:p-4">
                        {athlete.name}
                      </td>
                      <td className="hidden truncate p-3 normal-case gp-text-muted md:table-cell sm:p-4">
                        {athlete.email}
                      </td>
                      <td className="p-3 sm:p-4">
                        <PrimeMembershipBadge level={athlete.membershipLevel} />
                      </td>
                      <td className="truncate p-3 sm:p-4">
                        {mode === 'trainer' ? (
                          routineSummary ? (
                            <span
                              title={routineSummary.detailLabel}
                              className="inline-flex max-w-full items-center"
                            >
                              {routineSummary.source === 'weeklyPlan' ? (
                                <span className="truncate rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                                  {routineSummary.shortLabel}
                                </span>
                              ) : (
                                <span
                                  className={cn(
                                    'truncate font-medium',
                                    routineSummary.source === 'none'
                                      ? 'gp-text-muted'
                                      : 'gp-text-primary',
                                  )}
                                >
                                  {routineSummary.shortLabel}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="font-medium gp-text-muted">
                              {getRoutineLabel?.(athlete.id) ?? 'Sin rutina'}
                            </span>
                          )
                        ) : trainer ? (
                          <span className="font-medium gp-text-phosphor">{trainer.name}</span>
                        ) : (
                          <span className="font-medium gp-text-critical">Sin asignar</span>
                        )}
                      </td>
                      <td className="p-3 pr-4 sm:p-4 sm:pr-5">
                        <div className="flex items-center justify-center gap-1">
                          <PrimeTableRowAction
                            href={`${nutritionBasePath}/${athlete.id}/nutrition`}
                            label={`Nutrición de ${athlete.name}`}
                          >
                            <UtensilsCrossed className="h-4 w-4 gp-text-phosphor" aria-hidden />
                          </PrimeTableRowAction>
                          <PrimeTableRowAction
                            label={`Ver entrenamientos de ${athlete.name}`}
                            onClick={() => onViewPerformance(athlete)}
                          >
                            {mode === 'trainer' ? (
                              <Dumbbell className="h-4 w-4 gp-text-phosphor" aria-hidden />
                            ) : (
                              <Eye className="h-4 w-4 gp-text-primary" aria-hidden />
                            )}
                          </PrimeTableRowAction>
                          {mode === 'admin' ? (
                            <PrimeTableRowAction
                              label={`Ver entrenamientos de ${athlete.name}`}
                              onClick={() => onViewPerformance(athlete)}
                            >
                              <Dumbbell className="h-4 w-4 gp-text-phosphor" aria-hidden />
                            </PrimeTableRowAction>
                          ) : null}
                          {mode === 'admin' && onAssignTrainer ? (
                            <PrimeTableRowAction
                              label={`Asignar entrenador a ${athlete.name}`}
                              onClick={() => onAssignTrainer(athlete)}
                            >
                              <Link2 className="h-4 w-4 gp-text-phosphor" aria-hidden />
                            </PrimeTableRowAction>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden" aria-label="Listado de atletas">
            {paginated.items.map((athlete) => {
              const trainer =
                mode === 'admin' && getTrainerById && athlete.trainerId
                  ? getTrainerById(athlete.trainerId)
                  : undefined;
              const isSelected = selectedId === athlete.id;
              const routineSummary = getAthleteRoutineSummary?.(athlete.id);

              return (
                <li key={athlete.id}>
                  <button
                    type="button"
                    onClick={() => onSelectRow(athlete.id)}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition-colors',
                      isSelected
                        ? 'gp-table-row-active border-[#68ca62]/50'
                        : 'gp-border-outline/40 hover:gp-bg-surface-variant/20',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="gp-mono truncate text-sm font-bold gp-text-primary">{athlete.name}</p>
                        <p className="gp-mono mt-0.5 truncate text-xs gp-text-muted">{athlete.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <PrimeMembershipBadge
                            level={athlete.membershipLevel}
                            className="px-2 py-0.5 text-[10px]"
                          />
                          {mode === 'trainer' ? (
                            <span className="gp-mono truncate text-xs gp-text-muted">
                              {routineSummary?.shortLabel ?? getRoutineLabel?.(athlete.id) ?? 'Sin rutina'}
                            </span>
                          ) : trainer ? (
                            <span className="gp-mono truncate text-xs gp-text-phosphor">{trainer.name}</span>
                          ) : (
                            <span className="gp-mono text-xs gp-text-critical">Sin asignar</span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md gp-text-muted hover:gp-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gp-phosphor)]"
                            aria-label={`Acciones de ${athlete.name}`}
                          >
                            <MoreHorizontal className="h-5 w-5" aria-hidden />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem asChild>
                            <Link href={`${nutritionBasePath}/${athlete.id}/nutrition`}>
                              <UtensilsCrossed className="mr-2 h-4 w-4" aria-hidden />
                              Nutrición
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewPerformance(athlete)}>
                            {mode === 'trainer' ? (
                              <Dumbbell className="mr-2 h-4 w-4" aria-hidden />
                            ) : (
                              <Eye className="mr-2 h-4 w-4" aria-hidden />
                            )}
                            Ver entrenamientos
                          </DropdownMenuItem>
                          {mode === 'admin' ? (
                            <DropdownMenuItem onClick={() => onViewPerformance(athlete)}>
                              <Dumbbell className="mr-2 h-4 w-4" aria-hidden />
                              Rutina / desempeño
                            </DropdownMenuItem>
                          ) : null}
                          {mode === 'admin' && onAssignTrainer ? (
                            <DropdownMenuItem onClick={() => onAssignTrainer(athlete)}>
                              <Link2 className="mr-2 h-4 w-4" aria-hidden />
                              Asignar entrenador
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {paginated.total === 0 ? (
            <p className="gp-mono py-8 text-center text-sm gp-text-muted">
              No se encontraron atletas
            </p>
          ) : null}
        </div>

        <PrimePaginationBar
          page={paginated.page}
          pages={paginated.pages}
          rangeStart={paginated.rangeStart}
          rangeEnd={paginated.rangeEnd}
          total={paginated.total}
          onPrev={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(paginated.pages, current + 1))}
        />
      </div>
    </PrimeModule>
  );
}
