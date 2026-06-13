'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdmin, AthleteProfile } from '@/hooks/use-admin';
import { TrainerAssignmentModal } from '@/components/admin/trainer-assignment-modal';
import { Users, Dumbbell, TrendingUp, Link2, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AssignmentsPage() {
  const {
    athletes,
    trainers,
    assignableTrainers,
    assignTrainerToAthlete,
    unassignTrainerFromAthlete,
    updateTrainerCapacity,
    getTrainerById,
  } = useAdmin();
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, string>>({});
  const [savingCapacityId, setSavingCapacityId] = useState<string | null>(null);

  const assignmentMap = athletes.reduce(
    (acc, athlete) => {
      if (athlete.trainerId) {
        if (!acc[athlete.trainerId]) {
          acc[athlete.trainerId] = [];
        }
        acc[athlete.trainerId].push(athlete);
      }
      return acc;
    },
    {} as Record<string, typeof athletes>,
  );

  const unassignedAthletes = athletes.filter((a) => !a.trainerId);
  const activeTrainers = trainers.filter((t) => t.isActive !== false && !t.invitePending);

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

  return (
    <div className="px-8 py-12 space-y-8">
      <div>
        <h1 className="text-5xl font-bold tracking-tight mb-2">Asignaciones de Entrenadores</h1>
        <p className="text-lg text-muted-foreground">
          Visualiza y gestiona la asignación de atletas a entrenadores
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atletas Totales</p>
              <p className="text-3xl font-bold">{athletes.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-green-500/10 p-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Asignados</p>
              <p className="text-3xl font-bold">{athletes.length - unassignedAthletes.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Dumbbell className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sin Asignar</p>
              <p className="text-3xl font-bold">{unassignedAthletes.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Carga de Trabajo por Entrenador</h2>

        <div className="grid gap-6">
          {activeTrainers.map((trainer) => {
            const assignedAthletes = assignmentMap[trainer.id] || [];
            const capacity = trainer.maxAthletes ?? 10;
            const percentage = Math.min(100, (assignedAthletes.length / capacity) * 100);
            const capacityDraft = capacityDrafts[trainer.id] ?? String(capacity);

            return (
              <div
                key={trainer.id}
                className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{trainer.name}</h3>
                    <p className="text-sm text-muted-foreground">{trainer.specialization}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{assignedAthletes.length}</p>
                    <p className="text-sm text-muted-foreground">de {capacity} atletas</p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor={`capacity-${trainer.id}`}>
                      Capacidad máxima
                    </label>
                    <Input
                      id={`capacity-${trainer.id}`}
                      type="number"
                      min={1}
                      max={100}
                      className="h-9 w-24"
                      value={capacityDraft}
                      onChange={(e) =>
                        setCapacityDrafts((prev) => ({ ...prev, [trainer.id]: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={savingCapacityId === trainer.id}
                    onClick={() => void handleSaveCapacity(trainer.id, capacity)}
                  >
                    {savingCapacityId === trainer.id ? 'Guardando…' : 'Guardar'}
                  </Button>
                </div>

                <div className="mb-6">
                  <div className="h-3 rounded-full bg-secondary/20 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 bg-gradient-to-r ${
                        percentage >= 80
                          ? 'from-red-500 to-orange-500'
                          : percentage >= 60
                          ? 'from-yellow-500 to-orange-500'
                          : 'from-primary to-secondary'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{Math.round(percentage)}% de capacidad</p>
                </div>

                {assignedAthletes.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Atletas Asignados</p>
                    <div className="space-y-2">
                      {assignedAthletes.map((athlete) => (
                        <div
                          key={athlete.id}
                          className="flex items-center justify-between rounded-lg bg-secondary/5 p-3 border border-secondary/20 gap-3"
                        >
                          <div>
                            <p className="font-medium text-foreground">{athlete.name}</p>
                            <p className="text-xs text-muted-foreground">{athlete.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-full bg-primary/20 text-primary px-3 py-1 text-xs font-semibold">
                              {athlete.membershipLevel}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isAssigning}
                              onClick={() => openAssignModal(athlete)}
                              className="h-8 gap-1"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              Reasignar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isAssigning}
                              onClick={() => handleUnassign(athlete)}
                              className="h-8 gap-1 border-destructive/30 text-destructive"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                              Quitar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Sin atletas asignados aún</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {unassignedAthletes.length > 0 && (
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-8">
          <h2 className="text-2xl font-bold mb-6 text-orange-500">Atletas Pendientes de Asignación</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unassignedAthletes.map((athlete) => (
              <div
                key={athlete.id}
                className="rounded-lg border border-orange-500/20 bg-background p-4"
              >
                <p className="font-semibold text-foreground mb-1">{athlete.name}</p>
                <p className="text-sm text-muted-foreground mb-3">{athlete.email}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange-500/20 text-orange-500 px-3 py-1 text-xs font-semibold">
                    {athlete.membershipLevel}
                  </span>
                  <span className="rounded-full bg-red-500/20 text-red-500 px-3 py-1 text-xs font-semibold">
                    Sin entrenador
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isAssigning}
                    onClick={() => openAssignModal(athlete)}
                    className="gap-1"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Asignar entrenador
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
      />
    </div>
  );
}
