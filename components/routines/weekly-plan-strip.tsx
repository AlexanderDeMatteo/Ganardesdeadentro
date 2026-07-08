'use client';

import { cn } from '@/lib/utils';
import type { SessionLog, WeeklyPlan } from '@/lib/data/types';
import { getScheduledDateForDayIndex } from '@/lib/workout/session-utils';

export type DayStatus = 'rest' | 'pending' | 'in_progress' | 'completed' | 'partial';

interface WeeklyPlanStripProps {
  weeklyPlan: WeeklyPlan | null;
  weekSessionLogs: SessionLog[];
  selectedDayIndex: number | null;
  onSelectDay: (dayIndex: number) => void;
  routineNamesById?: Record<string, string>;
}

function statusForDay(
  dayIndex: number,
  weeklyPlan: WeeklyPlan | null,
  weekSessionLogs: SessionLog[],
): DayStatus {
  if (!weeklyPlan) return 'pending';
  const day = weeklyPlan.days.find((d) => d.dayIndex === dayIndex);
  if (!day?.routineId) return 'rest';
  const scheduled = getScheduledDateForDayIndex(weeklyPlan.weekStartDate, dayIndex);
  const log = weekSessionLogs.find((s) => s.scheduledDate === scheduled);
  if (!log) return 'pending';
  if (log.sessionOutcome === 'completed') return 'completed';
  if ((log.completedSets ?? 0) > 0) return 'partial';
  return 'partial';
}

function dayLabel(
  day: { routineId: string | null; focus?: string },
  routineNamesById: Record<string, string>,
): string {
  if (!day.routineId) return 'Descanso';
  if (day.focus) return day.focus;
  return routineNamesById[day.routineId] ?? 'Entreno';
}

export function WeeklyPlanStrip({
  weeklyPlan,
  weekSessionLogs,
  selectedDayIndex,
  onSelectDay,
  routineNamesById = {},
}: WeeklyPlanStripProps) {
  if (!weeklyPlan) {
    return (
      <div className="gp-module gp-module-corner border-dashed p-6 text-center">
        <p className="text-sm gp-text-muted">
          Tu entrenador aún no armó tu plan semanal. Mientras tanto puedes usar tu rutina activa.
        </p>
      </div>
    );
  }

  return (
    <div className="gp-module gp-module-corner p-4 sm:p-6">
      <h3 className="gp-label gp-text-primary">Semana</h3>
      <p className="mb-4 text-xs gp-text-muted">
        Toca un día para entrenar o revisar tu registro.
      </p>
      <div className="-mx-1 overflow-x-auto gp-scroll-thin px-1 pb-1">
        <div className="grid min-w-[28rem] grid-cols-7 gap-2 sm:min-w-full">
        {weeklyPlan.days.map((day) => {
          const status = statusForDay(day.dayIndex, weeklyPlan, weekSessionLogs);
          const isSelected = selectedDayIndex === day.dayIndex;
          const isRest = !day.routineId;
          return (
            <button
              key={day.dayIndex}
              type="button"
              disabled={isRest}
              onClick={() => onSelectDay(day.dayIndex)}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center rounded-lg border p-2 text-center transition-colors',
                isRest && 'cursor-default opacity-60 gp-border-outline gp-bg-surface-variant',
                !isRest && 'hover:border-[var(--gp-phosphor)]/50',
                isSelected && 'border-[var(--gp-phosphor)] ring-2 ring-[var(--gp-phosphor)]/30',
                status === 'completed' && !isRest && 'border-[var(--gp-phosphor)]/40 gp-bg-surface-variant',
                status === 'partial' && !isRest && 'border-[var(--gp-error-core)]/40 gp-bg-surface-variant',
                status === 'pending' && !isRest && 'gp-border-outline',
              )}
            >
              <span className="gp-mono text-xs font-bold gp-text-primary sm:text-sm">{day.label}</span>
              <span className="mt-1 line-clamp-2 text-[9px] gp-text-muted sm:text-[10px]">
                {dayLabel(day, routineNamesById)}
              </span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
