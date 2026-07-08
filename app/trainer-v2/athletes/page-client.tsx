'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AthleteDetailModal } from '@/components/admin/athlete-detail-modal';
import { PrimeAthleteInspector } from '@/components/admin-v2/prime-athlete-inspector';
import { PrimeAthletePerformanceModal } from '@/components/admin-v2/prime-athlete-performance-modal';
import { PrimeAthletesTable } from '@/components/admin-v2/prime-athletes-table';
import { PrimeFilterPills } from '@/components/admin-v2/prime-filter-pills';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { useTrainer } from '@/hooks/use-trainer';
import type { AthleteProfile } from '@/hooks/use-admin';
import { useIsBelowXl } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { getAthleteRoutineSummary } from '@/lib/workout/athlete-routine-label';
import { Skeleton } from '@/components/ui/skeleton';

type FilterKey = 'all' | 'no_routine' | 'basic' | 'premium' | 'pro';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'no_routine', label: 'Sin rutina' },
  { key: 'basic', label: 'Basic' },
  { key: 'premium', label: 'Premium' },
  { key: 'pro', label: 'Pro' },
];

export default function TrainerV2AthletesPageClient() {
  const searchParams = useSearchParams();
  const isBelowXl = useIsBelowXl();
  const initialAthleteId = searchParams.get('athlete');
  const {
    myAthletes,
    getActiveAssignmentForAthlete,
    getActiveWeeklyPlanForAthlete,
    athleteHasRoutine,
    getRoutineName,
    isLoading,
  } = useTrainer();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialAthleteId);
  const [modalAthlete, setModalAthlete] = useState<AthleteProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);

  useEffect(() => {
    setSelectedId(initialAthleteId);
  }, [initialAthleteId]);

  const getRoutineLabel = useCallback(
    (athleteId: string) =>
      getAthleteRoutineSummary(
        athleteId,
        getActiveWeeklyPlanForAthlete(athleteId),
        getActiveAssignmentForAthlete(athleteId) ?? null,
        getRoutineName,
      ).shortLabel,
    [getActiveWeeklyPlanForAthlete, getActiveAssignmentForAthlete, getRoutineName],
  );

  const getAthleteRoutineSummaryForRow = useCallback(
    (athleteId: string) =>
      getAthleteRoutineSummary(
        athleteId,
        getActiveWeeklyPlanForAthlete(athleteId),
        getActiveAssignmentForAthlete(athleteId) ?? null,
        getRoutineName,
      ),
    [getActiveWeeklyPlanForAthlete, getActiveAssignmentForAthlete, getRoutineName],
  );

  const filteredAthletes = useMemo(() => {
    return myAthletes.filter((a) => {
      if (filter === 'no_routine') return !athleteHasRoutine(a.id);
      if (filter === 'basic' || filter === 'premium' || filter === 'pro') {
        return a.membershipLevel === filter;
      }
      return true;
    });
  }, [myAthletes, filter, athleteHasRoutine]);

  const selectedAthlete = useMemo(
    () => myAthletes.find((a) => a.id === selectedId) ?? null,
    [myAthletes, selectedId],
  );

  const handleViewDetails = useCallback((athlete: AthleteProfile) => {
    setSelectedId(athlete.id);
    setModalAthlete(athlete);
    setIsDetailOpen(true);
  }, []);

  const handleViewPerformance = useCallback((athlete: AthleteProfile) => {
    setSelectedId(athlete.id);
    setModalAthlete(athlete);
    setIsPerformanceOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg gp-bg-surface-high" />
        <Skeleton className="h-96 rounded-lg gp-bg-surface-high" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="gp-display text-3xl gp-text-primary neon-text-glow">Mis atletas</h2>
        <p className="gp-mono mt-1 text-sm gp-text-muted">
          {filteredAthletes.length} registro(s) — atletas asignados a tu cuenta
        </p>
      </div>

      <PrimeModule modId="TRN-13" title="FILTROS_OPERATIVOS" className="overflow-hidden">
        <div className="p-4">
          <PrimeFilterPills filters={FILTERS} active={filter} onChange={setFilter} />
        </div>
      </PrimeModule>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(20rem,100%)]">
        <PrimeAthletesTable
          mode="trainer"
          athletes={filteredAthletes}
          selectedId={selectedId}
          onSelectRow={setSelectedId}
          getRoutineLabel={getRoutineLabel}
          getAthleteRoutineSummary={getAthleteRoutineSummaryForRow}
          nutritionBasePath="/trainer-v2/athletes"
          onViewPerformance={handleViewPerformance}
        />

        <aside className="hidden min-w-0 xl:block xl:w-full">
          {selectedAthlete ? (
            <PrimeAthleteInspector
              mode="trainer"
              athlete={selectedAthlete}
              getRoutineLabel={getRoutineLabel}
              nutritionBasePath="/trainer-v2/athletes"
              onViewProfile={() => handleViewDetails(selectedAthlete)}
              onViewPerformance={() => handleViewPerformance(selectedAthlete)}
            />
          ) : (
            <div className="gp-module flex min-h-[200px] items-center justify-center rounded-lg p-8 lg:min-h-[360px]">
              <p className="gp-mono text-center text-sm gp-text-muted">
                Selecciona un atleta de la tabla
              </p>
            </div>
          )}
        </aside>
      </div>

      <Sheet
        open={isBelowXl && Boolean(selectedAthlete)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto gp-bg-surface p-0">
          <SheetTitle className="sr-only">Detalle del atleta</SheetTitle>
          {selectedAthlete ? (
            <PrimeAthleteInspector
              mode="trainer"
              athlete={selectedAthlete}
              getRoutineLabel={getRoutineLabel}
              nutritionBasePath="/trainer-v2/athletes"
              onViewProfile={() => handleViewDetails(selectedAthlete)}
              onViewPerformance={() => handleViewPerformance(selectedAthlete)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <PrimeAthletePerformanceModal
        athlete={isPerformanceOpen ? modalAthlete : null}
        getRoutineName={getRoutineName}
        onClose={() => {
          setIsPerformanceOpen(false);
          setModalAthlete(null);
        }}
      />

      <AthleteDetailModal
        athlete={isDetailOpen ? modalAthlete : null}
        onClose={() => {
          setIsDetailOpen(false);
          setModalAthlete(null);
        }}
        nutritionBasePath="/trainer-v2/athletes"
        prime
      />
    </div>
  );
}
