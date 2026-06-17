'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { TrainerAssignmentModal } from '@/components/admin/trainer-assignment-modal';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import type { OperationQueueRow } from '@/hooks/use-admin-dashboard-metrics';
import { useAdmin, type AthleteProfile } from '@/hooks/use-admin';
import { AlertTriangle, UserPlus } from 'lucide-react';

type PrimeUnassignedAlertModalProps = {
  open: boolean;
  count: number;
  operations: OperationQueueRow[];
  onClose: () => void;
  onAssigned?: () => void;
};

export function PrimeUnassignedAlertModal({
  open,
  count,
  operations,
  onClose,
  onAssigned,
}: PrimeUnassignedAlertModalProps) {
  const { assignableTrainers, assignTrainerToAthlete } = useAdmin();
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  if (!open) return null;

  const openAssign = (row: OperationQueueRow) => {
    setSelectedAthlete({
      id: row.id,
      name: row.name,
      email: row.email,
      age: 0,
      gender: 'unknown',
      weight: 0,
      height: 0,
      joinDate: row.joinDate,
      membershipLevel: 'basic',
    });
  };

  const handleAssignConfirm = async (trainerId: string) => {
    if (!selectedAthlete) return;
    setIsAssigning(true);
    try {
      await assignTrainerToAthlete(selectedAthlete.id, trainerId);
      toast.success('Entrenador asignado correctamente');
      setSelectedAthlete(null);
      onAssigned?.();
      if (count <= 1) onClose();
    } catch {
      toast.error('No se pudo asignar el entrenador');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      <PrimeScrollableModal
        title={
          <span className="flex items-center gap-2 text-[#ffb4ab]">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            {count} Sin Entrenador
          </span>
        }
        onClose={onClose}
        size="lg"
        modId="04"
        fitContent
      >
        <p className="gp-mono mb-4 text-sm text-[#becab8]">
          Atletas pendientes de asignación. Resuelve la alerta asignando un entrenador disponible.
        </p>
        <ul className="space-y-2">
          {operations.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-md border border-[#ffb4ab]/20 bg-[#ffb4ab]/5 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="gp-mono text-sm text-[#dce5de]">{row.name}</p>
                <p className="gp-mono truncate text-xs text-[#899483]">{row.email}</p>
              </div>
              <button
                type="button"
                onClick={() => openAssign(row)}
                disabled={isAssigning}
                className="gp-chamfer gp-mono shrink-0 inline-flex items-center gap-1.5 bg-[#68ca62] px-3 py-2 text-xs font-bold text-[#003906] transition-colors hover:bg-[#83e77b] disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" aria-hidden />
                Asignar
              </button>
            </li>
          ))}
        </ul>
      </PrimeScrollableModal>

      <TrainerAssignmentModal
        athlete={selectedAthlete}
        trainers={assignableTrainers}
        onAssign={handleAssignConfirm}
        onClose={() => setSelectedAthlete(null)}
        prime
      />
    </>
  );
}
