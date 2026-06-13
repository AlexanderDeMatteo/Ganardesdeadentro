'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AthletesTable } from '@/components/admin/athletes-table';
import { AthleteDetailModal } from '@/components/admin/athlete-detail-modal';
import { EditAthleteModal } from '@/components/admin/edit-athlete-modal';
import { TrainerAssignmentModal } from '@/components/admin/trainer-assignment-modal';
import { useAdmin, AthleteProfile } from '@/hooks/use-admin';

export default function AthletesPage() {
  const {
    athletes,
    assignableTrainers,
    assignTrainerToAthlete,
    updateAthlete,
    assignMembershipToAthlete,
    getTrainerById,
  } = useAdmin();
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleViewDetails = (athlete: AthleteProfile) => {
    setSelectedAthlete(athlete);
    setIsDetailModalOpen(true);
  };

  const handleAssignTrainer = (athlete: AthleteProfile) => {
    setSelectedAthlete(athlete);
    setIsAssignmentModalOpen(true);
  };

  const handleEditAthlete = (athlete: AthleteProfile) => {
    setSelectedAthlete(athlete);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (payload: {
    athleteId: string;
    firstName: string;
    lastName: string;
    email: string;
    planId?: string;
  }) => {
    const name = [payload.firstName, payload.lastName].filter(Boolean).join(' ');
    await updateAthlete(payload.athleteId, { name, email: payload.email });
    if (payload.planId) {
      await assignMembershipToAthlete(payload.athleteId, payload.planId);
    }
    toast.success('Atleta actualizado');
    setSelectedAthlete(null);
    setIsEditModalOpen(false);
  };

  const handleAssignTrainerConfirm = async (trainerId: string) => {
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

  return (
    <div className="px-8 py-12 space-y-8">
      <div>
        <h1 className="text-5xl font-bold tracking-tight mb-2">Gestión de Atletas</h1>
        <p className="text-lg text-muted-foreground">
          Administra los perfiles, métricas y asignaciones de entrenadores
        </p>
      </div>

      <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-8 backdrop-blur-sm">
        <AthletesTable
          athletes={athletes}
          onViewDetails={handleViewDetails}
          onAssignTrainer={handleAssignTrainer}
          onEditAthlete={handleEditAthlete}
        />
      </div>

      <AthleteDetailModal
        athlete={isDetailModalOpen ? selectedAthlete : null}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAthlete(null);
        }}
      />

      <EditAthleteModal
        athlete={isEditModalOpen ? selectedAthlete : null}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAthlete(null);
        }}
        onSave={handleEditSave}
      />

      <TrainerAssignmentModal
        athlete={isAssignmentModalOpen ? selectedAthlete : null}
        trainers={assignableTrainers}
        currentTrainerName={
          selectedAthlete?.trainerId
            ? getTrainerById(selectedAthlete.trainerId)?.name
            : undefined
        }
        onAssign={handleAssignTrainerConfirm}
        onClose={() => {
          if (isAssigning) return;
          setIsAssignmentModalOpen(false);
          setSelectedAthlete(null);
        }}
      />
    </div>
  );
}
