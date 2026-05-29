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

export function WeeklyPlanStrip({
  weeklyPlan,
  weekSessionLogs,
  selectedDayIndex,
  onSelectDay,
}: WeeklyPlanStripProps) {
  if (!weeklyPlan) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Tu entrenador aún no armó tu plan semanal. Mientras tanto puedes usar tu rutina activa.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4 sm:p-6">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-foreground">Semana</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Toca un día para entrenar o revisar tu registro.
      </p>
      <div className="grid grid-cols-7 gap-2">
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
                'flex min-h-16 flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors',
                isRest && 'cursor-default opacity-60 border-border bg-muted/20',
                !isRest && 'hover:border-cyan-400/50',
                isSelected && 'border-cyan-400 ring-2 ring-cyan-400/30',
                status === 'completed' && !isRest && 'bg-lime-400/10 border-lime-400/40',
                status === 'partial' && !isRest && 'bg-amber-400/10 border-amber-400/40',
                status === 'pending' && !isRest && 'border-border',
              )}
            >
              <span className="text-xs font-bold">{day.label}</span>
              <span className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                {isRest ? 'Descanso' : day.focus ?? 'Entreno'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
