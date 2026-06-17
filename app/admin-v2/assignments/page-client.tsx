'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TrainerAssignmentModal } from '@/components/admin/trainer-assignment-modal';
import { PrimeAssignmentMatrix } from '@/components/admin-v2/prime-assignment-matrix';
import { PrimeKpiStrip } from '@/components/admin-v2/prime-kpi-strip';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { PrimePendingAssignments } from '@/components/admin-v2/prime-pending-assignments';
import { useAdmin, type AthleteProfile } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { Dumbbell, TrendingUp, Users } from 'lucide-react';

export default function AdminV2AssignmentsPage() {
  const {
    athletes,
    trainers,
    assignableTrainers,
    assignTrainerToAthlete,
    unassignTrainerFromAthlete,
    updateTrainerCapacity,
    getTrainerById,
    isLoading,
  } = useAdmin();

  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, string>>({});
  const [savingCapacityId, setSavingCapacityId] = useState<string | null>(null);

  const assignmentMap = useMemo(
    () =>
      athletes.reduce(
        (acc, athlete) => {
          if (athlete.trainerId) {
            if (!acc[athlete.trainerId]) acc[athlete.trainerId] = [];
            acc[athlete.trainerId].push(athlete);
          }
          return acc;
        },
        {} as Record<string, typeof athletes>,
      ),
    [athletes],
  );

  const unassignedAthletes = useMemo(
    () => athletes.filter((a) => !a.trainerId),
    [athletes],
  );

  const activeTrainers = useMemo(
    () => trainers.filter((t) => t.isActive !== false && !t.invitePending),
    [trainers],
  );

  const activeTrainerIds = useMemo(
    () => new Set(activeTrainers.map((t) => t.id)),
    [activeTrainers],
  );

  const matrixTrainers = useMemo(
    () =>
      trainers.filter(
        (t) =>
          activeTrainerIds.has(t.id) || (assignmentMap[t.id]?.length ?? 0) > 0,
      ),
    [trainers, activeTrainerIds, assignmentMap],
  );

  const orphanedAthletes = useMemo(
    () =>
      athletes.filter(
        (a) => a.trainerId && !trainers.some((t) => t.id === a.trainerId),
      ),
    [athletes, trainers],
  );

  const openAssignModal = (athlete: AthleteProfile) => {
    setSelectedAthlete(athlete);
    setIsAssignmentModalOpen(true);
  };

  const handleAssignConfirm = async (trainerId: string) => {
    if (!selectedAthlete) return;
    setIsAssigning(true);
    try {
      await assignTrainerToAthlete(selectedAthlete.id, trainerId);
      toast.success('Entrenador asignado correctamente');
      setSelectedAthlete(null);
      setIsAssignmentModalOpen(false);
    } catch {
      toast.error('No se pudo asignar el entrenador');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (athlete: AthleteProfile) => {
    setIsAssigning(true);
    try {
      await unassignTrainerFromAthlete(athlete.id);
      toast.success('Entrenador desasignado');
    } catch {
      toast.error('No se pudo desasignar el entrenador');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveCapacity = async (trainerId: string, fallback: number) => {
    const raw = capacityDrafts[trainerId] ?? String(fallback);
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
      toast.error('Capacidad debe ser entre 1 y 100');
      return;
    }
    setSavingCapacityId(trainerId);
    try {
      await updateTrainerCapacity(trainerId, parsed);
      toast.success('Capacidad actualizada');
      setCapacityDrafts((prev) => {
        const next = { ...prev };
        delete next[trainerId];
        return next;
      });
    } catch {
      toast.error('No se pudo actualizar la capacidad');
    } finally {
      setSavingCapacityId(null);
    }
  };

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
      <PrimePageHeader
        title="Asignaciones"
        subtitle="Visualiza y gestiona la asignación de atletas a entrenadores"
      />

      <PrimeKpiStrip
        items={[
          { label: 'Atletas totales', value: athletes.length, icon: Users },
          {
            label: 'Asignados',
            value: athletes.length - unassignedAthletes.length,
            icon: TrendingUp,
          },
          {
            label: 'Sin asignar',
            value: unassignedAthletes.length,
            icon: Dumbbell,
            layout: unassignedAthletes.length > 0 ? 'critical' : 'satellite',
          },
        ]}
      />

      <PrimePendingAssignments
        athletes={unassignedAthletes}
        onAssign={openAssignModal}
        isAssigning={isAssigning}
      />

      <PrimePendingAssignments
        athletes={orphanedAthletes}
        onAssign={openAssignModal}
        isAssigning={isAssigning}
        modId="42b"
        title="ENTRENADOR_NO_DISPONIBLE"
        actionLabel="Reasignar"
      />

      <PrimeAssignmentMatrix
        trainers={matrixTrainers}
        assignmentMap={assignmentMap}
        capacityDrafts={capacityDrafts}
        onCapacityChange={(trainerId, value) =>
          setCapacityDrafts((prev) => ({ ...prev, [trainerId]: value }))
        }
        onSaveCapacity={handleSaveCapacity}
        savingCapacityId={savingCapacityId}
        onReassign={openAssignModal}
        onUnassign={handleUnassign}
        isAssigning={isAssigning}
      />

      <TrainerAssignmentModal
        athlete={isAssignmentModalOpen ? selectedAthlete : null}
        trainers={assignableTrainers}
        currentTrainerName={
          selectedAthlete?.trainerId
            ? getTrainerById(selectedAthlete.trainerId)?.name
            : undefined
        }
        onAssign={handleAssignConfirm}
        onClose={() => {
          if (isAssigning) return;
          setIsAssignmentModalOpen(false);
          setSelectedAthlete(null);
        }}
        prime
      />
    </div>
  );
}
