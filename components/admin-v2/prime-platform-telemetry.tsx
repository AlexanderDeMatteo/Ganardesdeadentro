'use client';

import { Activity, BarChart3 } from 'lucide-react';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import type { WeeklyBarPoint } from '@/hooks/use-admin-dashboard-metrics';

type PrimePlatformTelemetryProps = {
  workoutsCompletedThisWeek: number;
  metricsLoggedToday: number;
  weeklyBars: WeeklyBarPoint[];
};

export function PrimePlatformTelemetry({
  workoutsCompletedThisWeek,
  metricsLoggedToday,
  weeklyBars,
}: PrimePlatformTelemetryProps) {
  const maxCount = Math.max(1, ...weeklyBars.map((bar) => bar.count));

  return (
    <PrimeModule modId="09" title="TELEMETRÍA_ENTRENAMIENTOS" className="flex flex-col justify-between">
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="gp-metric rounded-md border border-[#3f4a3c]/50 bg-[#2e3732]/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-[#83e77b]">
              <Activity className="h-4 w-4" aria-hidden />
              <span className="gp-mono text-[10px] uppercase">Esta semana</span>
            </div>
            <p className="text-2xl font-bold text-[#dce5de]">{workoutsCompletedThisWeek}</p>
            <p className="gp-mono mt-1 text-[10px] text-[#899483]">Entrenamientos completados</p>
          </div>
          <div className="gp-metric rounded-md border border-[#3f4a3c]/50 bg-[#2e3732]/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-[#83e77b]">
              <BarChart3 className="h-4 w-4" aria-hidden />
              <span className="gp-mono text-[10px] uppercase">Hoy</span>
            </div>
            <p className="text-2xl font-bold text-[#dce5de]">{metricsLoggedToday}</p>
            <p className="gp-mono mt-1 text-[10px] text-[#899483]">Métricas registradas</p>
          </div>
        </div>

        <div>
          <p className="gp-mono mb-3 text-xs uppercase text-[#becab8]">Actividad semanal</p>
          <div className="flex h-28 items-end justify-between gap-2">
            {weeklyBars.map((bar) => (
              <div key={bar.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="gp-phosphor-glow w-full rounded-t-sm bg-[#68ca62]/80 transition-all"
                  style={{ height: `${Math.max(8, (bar.count / maxCount) * 100)}%` }}
                  title={`${bar.count} entrenamientos`}
                />
                <span className="gp-mono text-[10px] text-[#899483]">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PrimeModule>
  );
}
