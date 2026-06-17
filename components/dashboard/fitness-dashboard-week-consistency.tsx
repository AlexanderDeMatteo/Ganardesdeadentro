'use client';

import type { SessionLog, WeeklyPlan } from '@/lib/data/types';
import { getScheduledDateForDayIndex } from '@/lib/workout/session-utils';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

interface FitnessDashboardWeekConsistencyProps {
  weeklyPlan: WeeklyPlan | null;
  weekSessionLogs: SessionLog[];
  weekStartDate: string;
}

function dayHasActivity(
  dayIndex: number,
  weeklyPlan: WeeklyPlan | null,
  weekSessionLogs: SessionLog[],
  weekStartDate: string,
): boolean {
  if (!weeklyPlan) {
    return weekSessionLogs.some((s) => {
      const d = new Date(s.scheduledDate + 'T12:00:00');
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      return idx === dayIndex && (s.sessionOutcome === 'completed' || s.completed);
    });
  }
  const day = weeklyPlan.days.find((d) => d.dayIndex === dayIndex);
  if (!day?.routineId) return false;
  const scheduled = getScheduledDateForDayIndex(weekStartDate, dayIndex);
  return weekSessionLogs.some(
    (s) =>
      s.scheduledDate === scheduled &&
      (s.sessionOutcome === 'completed' || s.completed || (s.completedSets ?? 0) > 0),
  );
}

export function FitnessDashboardWeekConsistency({
  weeklyPlan,
  weekSessionLogs,
  weekStartDate,
}: FitnessDashboardWeekConsistencyProps) {
  const weekActive = DAY_LABELS.map((_, i) =>
    dayHasActivity(i, weeklyPlan, weekSessionLogs, weekStartDate),
  );
  const plannedDays = weeklyPlan
    ? weeklyPlan.days.filter((d) => d.routineId).length
    : 7;
  const activeCount = weekActive.filter(Boolean).length;
  const consistencyPct =
    plannedDays > 0 ? Math.round((activeCount / plannedDays) * 100) : 0;

  return (
    <div className="gp-module gp-module-corner p-6">
      <h3 className="gp-label gp-text-muted">Consistencia semanal</h3>
      <p className="mb-4 text-sm font-bold gp-text-primary">
        {weeklyPlan ? 'Plan del entrenador' : 'Esta semana'}
      </p>
      <div className="mb-6 flex justify-between gap-1">
        {weekActive.map((on, i) => (
          <div key={DAY_LABELS[i]} className="flex flex-col items-center gap-2">
            <span
              className={
                on
                  ? 'size-3 rounded-full bg-[var(--gp-phosphor)] gp-phosphor-glow'
                  : 'size-3 rounded-full gp-bg-surface-variant'
              }
              aria-label={on ? `${DAY_LABELS[i]}: actividad` : `${DAY_LABELS[i]}: sin actividad`}
            />
            <span className="gp-mono text-[10px] gp-text-muted">{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
      <div className="mb-2 flex justify-between text-xs gp-text-muted">
        <span>Consistencia</span>
        <span className="gp-text-phosphor">{consistencyPct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full gp-bg-surface-variant">
        <div
          className="h-full rounded-full bg-[var(--gp-phosphor)] gp-phosphor-glow"
          style={{ width: `${consistencyPct}%` }}
        />
      </div>
    </div>
  );
}
