'use client';

import type { AthleteProfile } from '@/hooks/use-admin';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeMembershipBadge } from '@/components/admin-v2/prime-membership-badge';
import { PrimeModule } from '@/components/admin-v2/prime-module';

type PrimePendingAssignmentsProps = {
  athletes: AthleteProfile[];
  onAssign: (athlete: AthleteProfile) => void;
  isAssigning: boolean;
  title?: string;
  modId?: string;
  actionLabel?: string;
};

export function PrimePendingAssignments({
  athletes,
  onAssign,
  isAssigning,
  title = 'PENDIENTES_ASIGNACIÓN',
  modId = '42',
  actionLabel = 'Asignar',
}: PrimePendingAssignmentsProps) {
  if (athletes.length === 0) return null;

  return (
    <PrimeModule modId={modId} title={title} variant="critical">
      <div className="space-y-3 p-4 sm:p-5">
        {athletes.map((athlete) => (
          <div
            key={athlete.id}
            className="flex flex-col gap-3 rounded-lg border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="gp-display text-sm gp-text-primary">{athlete.name}</p>
              <p className="gp-mono text-xs gp-text-muted">{athlete.email}</p>
              <div className="mt-2">
                <PrimeMembershipBadge level={athlete.membershipLevel} />
              </div>
            </div>
            <PrimeChamferButton
              onClick={() => onAssign(athlete)}
              disabled={isAssigning}
              className="shrink-0 text-xs"
            >
              {actionLabel}
            </PrimeChamferButton>
          </div>
        ))}
      </div>
    </PrimeModule>
  );
}
