'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { TrainerAssignmentModal } from '@/components/admin/trainer-assignment-modal';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import type { OperationQueueRow } from '@/hooks/use-admin-dashboard-metrics';
import { useAdmin, type AthleteProfile } from '@/hooks/use-admin';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

type PrimeOperationsQueueProps = {
  operations: OperationQueueRow[];
  onAssigned?: () => void;
};

function formatJoinDate(iso: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function priorityClass(priority: OperationQueueRow['priority']) {
  if (priority === 'ALTA') {
    return 'border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]';
  }
  if (priority === 'MEDIA') {
    return 'border-[#f2b84b]/30 bg-[#f2b84b]/10 text-[#f2b84b]';
  }
  return 'border-[#3f4a3c] bg-[#2e3732]/30 text-[#becab8]';
}

export function PrimeOperationsQueue({ operations, onAssigned }: PrimeOperationsQueueProps) {
  const { assignableTrainers, assignTrainerToAthlete } = useAdmin();
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

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
    } catch {
      toast.error('No se pudo asignar el entrenador');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      <PrimeModule modId="05" title="COLA_DE_OPERACIONES" className="overflow-hidden">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="gp-mono border-b border-[#3f4a3c]/50 bg-[#2e3732]/30 text-xs uppercase text-[#becab8]">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Fecha ingreso</th>
                <th className="p-4 text-center font-medium">Prioridad</th>
                <th className="p-4 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="gp-mono text-sm">
              {operations.length > 0 ? (
                operations.slice(0, 8).map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#3f4a3c]/20 transition-colors hover:bg-[#2e3732]/20"
                  >
                    <td className="p-4 text-[#dce5de]">{row.name}</td>
                    <td className="p-4 text-[#becab8]">{formatJoinDate(row.joinDate)}</td>
                    <td className="p-4 text-center">
                      <span
                        className={cn(
                          'gp-metric inline-block rounded-full border px-3 py-1 text-[10px]',
                          priorityClass(row.priority),
                        )}
                      >
                        {row.priority}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => openAssign(row)}
                        className="gp-chamfer gp-mono inline-flex items-center gap-1.5 rounded-sm border border-[#68ca62]/40 px-3 py-1.5 text-xs text-[#83e77b] transition-colors hover:bg-[#68ca62]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
                      >
                        <UserPlus className="h-3.5 w-3.5" aria-hidden />
                        Asignar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="gp-mono p-8 text-center text-[#becab8]">
                    Cola de operaciones vacía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3 p-4 lg:hidden" aria-label="Cola de operaciones">
          {operations.length > 0 ? (
            operations.slice(0, 8).map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-[#3f4a3c]/40 p-4 transition-colors hover:bg-[#2e3732]/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="gp-mono text-sm font-medium text-[#dce5de]">{row.name}</p>
                    <p className="gp-mono mt-1 text-xs text-[#becab8]">
                      Ingreso: {formatJoinDate(row.joinDate)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'gp-metric shrink-0 rounded-full border px-3 py-1 text-[10px]',
                      priorityClass(row.priority),
                    )}
                  >
                    {row.priority}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openAssign(row)}
                  className="gp-chamfer gp-mono mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-[#68ca62]/40 px-3 py-2 text-xs text-[#83e77b] transition-colors hover:bg-[#68ca62]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden />
                  Asignar entrenador
                </button>
              </li>
            ))
          ) : (
            <li className="gp-mono py-8 text-center text-[#becab8]">Cola de operaciones vacía</li>
          )}
        </ul>
      </PrimeModule>

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
