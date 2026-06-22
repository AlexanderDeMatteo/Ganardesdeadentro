'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AthleteDetailModal } from '@/components/admin/athlete-detail-modal';
import { TrainerAssignmentModal } from '@/components/admin/trainer-assignment-modal';
import { PrimeAthleteAssignMembershipModal } from '@/components/admin-v2/prime-athlete-assign-membership-modal';
import { PrimeAthleteInspector } from '@/components/admin-v2/prime-athlete-inspector';
import { PrimeAthletePerformanceModal } from '@/components/admin-v2/prime-athlete-performance-modal';
import { PrimeAthletesTable } from '@/components/admin-v2/prime-athletes-table';
import { PrimeFilterPills } from '@/components/admin-v2/prime-filter-pills';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { useAdmin, type AthleteProfile } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';

type FilterKey = 'all' | 'unassigned' | 'basic' | 'premium' | 'pro';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'unassigned', label: 'Sin entrenador' },
  { key: 'basic', label: 'Basic' },
  { key: 'premium', label: 'Premium' },
  { key: 'pro', label: 'Pro' },
];

export default function AdminV2AthletesPage() {
  const searchParams = useSearchParams();
  const initialAthleteId = searchParams.get('athlete');
  const {
    athletes,
    assignableTrainers,
    assignTrainerToAthlete,
    assignMembershipToAthlete,
    getTrainerById,
    routines,
    isLoading,
  } = useAdmin();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialAthleteId);

  useEffect(() => {
    setSelectedId(initialAthleteId);
  }, [initialAthleteId]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [modalAthlete, setModalAthlete] = useState<AthleteProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (filter === 'unassigned') return !a.trainerId;
      if (filter === 'basic' || filter === 'premium' || filter === 'pro') {
        return a.membershipLevel === filter;
      }
      return true;
    });
  }, [athletes, filter]);

  const selectedAthlete = useMemo(
    () => athletes.find((a) => a.id === selectedId) ?? null,
    [athletes, selectedId],
  );

  const selectAthlete = useCallback((athlete: AthleteProfile) => {
    setSelectedId(athlete.id);
  }, []);

  const handleViewDetails = useCallback((athlete: AthleteProfile) => {
    selectAthlete(athlete);
    setModalAthlete(athlete);
    setIsDetailOpen(true);
  }, [selectAthlete]);

  const handleViewPerformance = useCallback((athlete: AthleteProfile) => {
    selectAthlete(athlete);
    setModalAthlete(athlete);
    setIsPerformanceOpen(true);
  }, [selectAthlete]);

  const handleAssignTrainer = useCallback((athlete: AthleteProfile) => {
    selectAthlete(athlete);
    setModalAthlete(athlete);
    setIsAssignOpen(true);
  }, [selectAthlete]);

  const handleAssignMembership = useCallback((athlete: AthleteProfile) => {
    selectAthlete(athlete);
    setModalAthlete(athlete);
    setIsMembershipOpen(true);
  }, [selectAthlete]);

  const handleAssignMembershipConfirm = useCallback(
    async (athleteId: string, planId: string) => {
      await assignMembershipToAthlete(athleteId, planId);
      toast.success('Membresía asignada correctamente');
      setModalAthlete(null);
      setIsMembershipOpen(false);
    },
    [assignMembershipToAthlete],
  );

  const getRoutineName = useCallback(
    (routineId: string) => routines.find((r) => r.id === routineId)?.name ?? 'Rutina',
    [routines],
  );

  const handleAssignConfirm = useCallback(
    async (trainerId: string) => {
      if (!modalAthlete) return;
      setIsAssigning(true);
      try {
        await assignTrainerToAthlete(modalAthlete.id, trainerId);
        toast.success('Entrenador asignado correctamente');
        setModalAthlete(null);
        setIsAssignOpen(false);
      } catch {
        toast.error('No se pudo asignar el entrenador');
      } finally {
        setIsAssigning(false);
      }
    },
    [modalAthlete, assignTrainerToAthlete],
  );

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
        <h2 className="gp-display text-3xl gp-text-primary neon-text-glow">Atletas</h2>
        <p className="gp-mono mt-1 text-sm gp-text-muted">
          {filteredAthletes.length} registro(s) — usa acciones en fila o el inspector lateral
        </p>
      </div>

      <PrimeModule modId="13" title="FILTROS_OPERATIVOS" className="overflow-hidden">
        <div className="p-4">
          <PrimeFilterPills filters={FILTERS} active={filter} onChange={setFilter} />
        </div>
      </PrimeModule>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(20rem,100%)]">
        <PrimeAthletesTable
          athletes={filteredAthletes}
          selectedId={selectedId}
          onSelectRow={setSelectedId}
          getTrainerById={getTrainerById}
          nutritionBasePath="/admin-v2/athletes"
          onViewPerformance={handleViewPerformance}
          onAssignTrainer={handleAssignTrainer}
        />

        <aside className="min-w-0 xl:w-full">
          {selectedAthlete ? (
            <PrimeAthleteInspector
              athlete={selectedAthlete}
              getTrainerById={getTrainerById}
              nutritionBasePath="/admin-v2/athletes"
              onViewProfile={() => handleViewDetails(selectedAthlete)}
              onViewPerformance={() => handleViewPerformance(selectedAthlete)}
              onAssignTrainer={() => handleAssignTrainer(selectedAthlete)}
              onAssignMembership={() => handleAssignMembership(selectedAthlete)}
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
        nutritionBasePath="/admin-v2/athletes"
        prime
      />

      <TrainerAssignmentModal
        athlete={isAssignOpen ? modalAthlete : null}
        trainers={assignableTrainers}
        currentTrainerName={
          modalAthlete?.trainerId
            ? getTrainerById(modalAthlete.trainerId)?.name
            : undefined
        }
        onAssign={(trainerId) => void handleAssignConfirm(trainerId)}
        onClose={() => {
          if (isAssigning) return;
          setIsAssignOpen(false);
          setModalAthlete(null);
        }}
        prime
      />

      <PrimeAthleteAssignMembershipModal
        athlete={isMembershipOpen ? modalAthlete : null}
        onAssign={handleAssignMembershipConfirm}
        onClose={() => {
          setIsMembershipOpen(false);
          setModalAthlete(null);
        }}
      />
    </div>
  );
}
