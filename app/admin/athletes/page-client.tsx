'use client';

import { useState } from 'react';
import { AthletesTable } from '@/components/admin/athletes-table';
import { AthleteDetailModal } from '@/components/admin/athlete-detail-modal';
import { TrainerAssignmentModal } from '@/components/admin/trainer-assignment-modal';
import { useAdmin, AthleteProfile } from '@/hooks/use-admin';

export default function AthletesPage() {
  const { athletes, trainers, assignTrainerToAthlete } = useAdmin();
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  const handleViewDetails = (athlete: AthleteProfile) => {
    setSelectedAthlete(athlete);
    setIsDetailModalOpen(true);
  };

  const handleAssignTrainer = (athlete: AthleteProfile) => {
    setSelectedAthlete(athlete);
    setIsAssignmentModalOpen(true);
  };

  const handleAssignTrainerConfirm = (trainerId: string) => {
    if (selectedAthlete) {
      assignTrainerToAthlete(selectedAthlete.id, trainerId);
      setSelectedAthlete(null);
      setIsAssignmentModalOpen(false);
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
        />
      </div>

      <AthleteDetailModal
        athlete={isDetailModalOpen ? selectedAthlete : null}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAthlete(null);
        }}
      />

      <TrainerAssignmentModal
        athlete={isAssignmentModalOpen ? selectedAthlete : null}
        trainers={trainers}
        onAssign={handleAssignTrainerConfirm}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setSelectedAthlete(null);
        }}
      />
    </div>
  );
}
