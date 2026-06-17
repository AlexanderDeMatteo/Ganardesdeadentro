'use client';

import { Mail } from 'lucide-react';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import type { AtRiskAthlete } from '@/hooks/use-admin-dashboard-metrics';
import { cn } from '@/lib/utils';

type PrimeRetentionPanelProps = {
  atRiskAthletes: AtRiskAthlete[];
};

function riskBadge(athlete: AtRiskAthlete) {
  if (athlete.reason === 'expiring') {
    return {
      label: `Vence en ${athlete.daysRemaining ?? 0}d`,
      className: 'border-[#f2b84b]/30 bg-[#f2b84b]/10 text-[#f2b84b]',
    };
  }
  return {
    label: `Inactivo ${athlete.inactiveDays ?? 7}d`,
    className: 'border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]',
  };
}

export function PrimeRetentionPanel({ atRiskAthletes }: PrimeRetentionPanelProps) {
  const visible = atRiskAthletes.slice(0, 6);

  return (
    <PrimeModule modId="03" title="ALERTA_RETENCIÓN" variant="critical" className="flex flex-col">
      <div className="flex flex-1 flex-col gap-3 p-4">
        {visible.length > 0 ? (
          visible.map((athlete) => {
            const badge = riskBadge(athlete);
            return (
              <div
                key={`${athlete.athleteId}-${athlete.reason}`}
                className="group flex items-center justify-between gap-3 rounded-md border border-[#3f4a3c]/40 bg-[#2e3732]/20 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="gp-mono truncate text-sm text-[#dce5de]">{athlete.name}</p>
                  <p className="gp-mono truncate text-xs text-[#899483]">{athlete.email}</p>
                  <span
                    className={cn(
                      'gp-metric mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase',
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
                <a
                  href={`mailto:${athlete.email}`}
                  className="gp-chamfer shrink-0 rounded-sm border border-[#68ca62]/40 p-2 text-[#83e77b] transition-colors hover:bg-[#68ca62]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
                  aria-label={`Contactar a ${athlete.name}`}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                </a>
              </div>
            );
          })
        ) : (
          <p className="gp-mono py-8 text-center text-sm text-[#becab8]">
            Sin alertas de retención activas
          </p>
        )}
      </div>
    </PrimeModule>
  );
}
