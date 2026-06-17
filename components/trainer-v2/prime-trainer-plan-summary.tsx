'use client';

import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import type { WeeklyPlan } from '@/lib/data/types';
import { WEEK_DAY_LABELS } from '@/lib/data/types';
import { CalendarDays } from 'lucide-react';

interface PrimeTrainerPlanSummaryProps {
  athleteId: string;
  athleteName?: string;
  weeklyPlan: WeeklyPlan | null;
  getRoutineName: (routineId: string) => string;
  onEditInWeeklyPlan: () => void;
}

export function PrimeTrainerPlanSummary({
  athleteId,
  athleteName,
  weeklyPlan,
  getRoutineName,
  onEditInWeeklyPlan,
}: PrimeTrainerPlanSummaryProps) {
  if (!athleteId) return null;

  const days =
    weeklyPlan?.days?.length === 7
      ? weeklyPlan.days
      : WEEK_DAY_LABELS.map((label, dayIndex) => ({
          dayIndex,
          label,
          routineId: null as string | null,
          focus: undefined as string | undefined,
        }));

  const hasPublishedPlan = Boolean(weeklyPlan?.isActive);

  return (
    <PrimeModule modId="TRN-52" title="RESUMEN_PLAN_ACTIVO">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded border gp-border-outline/40 gp-bg-surface-variant/30 p-2">
              <CalendarDays className="h-5 w-5 gp-text-phosphor" />
            </div>
            <div>
              <p className="font-bold gp-text-primary">
                {athleteName ? `Plan de ${athleteName}` : 'Plan semanal activo'}
              </p>
              {hasPublishedPlan ? (
                <p className="gp-mono text-sm gp-text-muted">
                  Semana del {weeklyPlan!.weekStartDate}
                </p>
              ) : (
                <p className="gp-mono text-sm gp-text-muted">
                  Publica un plan semanal para este atleta
                </p>
              )}
            </div>
          </div>
          <PrimeChamferButton type="button" onClick={onEditInWeeklyPlan}>
            Editar en plan semanal
          </PrimeChamferButton>
        </div>

        {hasPublishedPlan ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((day) => (
              <div
                key={day.dayIndex}
                className="rounded border gp-border-outline/30 gp-bg-surface-variant/20 px-3 py-2"
              >
                <p className="gp-mono text-xs uppercase gp-text-muted">{day.label}</p>
                <p className="mt-1 text-sm font-medium gp-text-primary">
                  {day.routineId ? getRoutineName(day.routineId) : 'Descanso'}
                </p>
                {day.focus ? (
                  <p className="gp-mono mt-0.5 truncate text-xs gp-text-dim">{day.focus}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </PrimeModule>
  );
}
