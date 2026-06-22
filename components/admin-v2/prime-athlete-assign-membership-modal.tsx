'use client';

import { useState } from 'react';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { Button } from '@/components/ui/button';
import { useMemberships } from '@/hooks/use-memberships';
import type { AthleteProfile } from '@/hooks/use-admin';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PrimeAthleteAssignMembershipModalProps = {
  athlete: AthleteProfile | null;
  onAssign: (athleteId: string, planId: string) => Promise<void>;
  onClose: () => void;
};

export function PrimeAthleteAssignMembershipModal({
  athlete,
  onAssign,
  onClose,
}: PrimeAthleteAssignMembershipModalProps) {
  const { plans, isLoading } = useMemberships();
  const [planId, setPlanId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!athlete) return null;

  const handleSubmit = async () => {
    if (!planId) return;
    setIsSaving(true);
    try {
      await onAssign(athlete.id, planId);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PrimeScrollableModal
      title="Asignar membresía"
      onClose={onClose}
      fitContent
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="gp-mono gp-border-outline gp-bg-surface-high gp-text-muted hover:gp-text-phosphor"
          >
            Cancelar
          </Button>
          <PrimeChamferButton
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!planId || isSaving}
          >
            {isSaving ? 'Asignando…' : 'Asignar plan'}
          </PrimeChamferButton>
        </div>
      }
    >
      <p className="gp-mono mb-4 text-sm gp-text-muted">
        Selecciona un plan para {athlete.name}. La membresía activa desbloquea rutinas, métricas y
        nutrición.
      </p>
      {isLoading ? (
        <LoadingState label="Cargando planes…" />
      ) : (
        <div className="space-y-4">
          <label className="gp-label block gp-text-dim" htmlFor="membership-plan-select">
            Plan de membresía
          </label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger id="membership-plan-select" className="gp-border-outline gp-bg-surface-high">
              <SelectValue placeholder="Seleccionar plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} · {plan.durationDays ?? 30} días
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </PrimeScrollableModal>
  );
}
