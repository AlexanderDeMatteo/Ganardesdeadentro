'use client';

import { useMemo, useState } from 'react';
import type { PerformancePeriod } from '@/lib/admin-v2/athlete-performance';
import { PERFORMANCE_PERIOD_LABELS } from '@/lib/admin-v2/athlete-performance';
import type { SessionLog } from '@/lib/data/types';
import {
  DAY_LABELS,
  buildActivityHeatmap,
  formatHeatmapDateLabel,
  type HeatmapDayCell,
  type HeatmapIntensity,
} from '@/lib/workout/activity-heatmap';
import { AthleteSessionDayDetail } from '@/components/routines/athlete-session-day-detail';
import { cn } from '@/lib/utils';

type WorkoutActivityHeatmapProps = {
  sessions: SessionLog[];
  period: PerformancePeriod;
  routineNames?: Record<string, string>;
  theme?: 'prime' | 'default';
};

const INTENSITY_PRIME: Record<HeatmapIntensity, string> = {
  0: 'bg-[#1a1f24] border gp-border-outline/30',
  1: 'bg-[#255831]/60 border-[#255831]',
  2: 'bg-[#3d8f4a]/70 border-[#3d8f4a]',
  3: 'bg-[#68ca62]/80 border-[#68ca62]',
  4: 'bg-[#95fa8b] border-[#95fa8b]',
};

const INTENSITY_DEFAULT: Record<HeatmapIntensity, string> = {
  0: 'bg-muted/40 border-border/40',
  1: 'bg-cyan-400/25 border-cyan-400/30',
  2: 'bg-cyan-400/45 border-cyan-400/50',
  3: 'bg-cyan-400/65 border-cyan-400/70',
  4: 'bg-cyan-400 border-cyan-300',
};

function monthLabels(weeks: { weekStart: string }[]): string[] {
  const labels: string[] = [];
  let lastMonth = '';
  for (const week of weeks) {
    const month = new Date(`${week.weekStart}T12:00:00`).toLocaleDateString('es-ES', {
      month: 'short',
    });
    labels.push(month !== lastMonth ? month : '');
    lastMonth = month;
  }
  return labels;
}

function cellAriaLabel(cell: HeatmapDayCell): string {
  if (cell.level === 0) {
    return `${formatHeatmapDateLabel(cell.date)}: sin entrenamiento`;
  }
  const session = cell.sessions[0];
  const completed = session?.completedSets ?? 0;
  const total = session?.totalSets ?? 0;
  const failed = cell.hasFailures ? ', con series fallidas' : '';
  return `${formatHeatmapDateLabel(cell.date)}: entrenamiento, ${completed} de ${total} series${failed}`;
}

export function WorkoutActivityHeatmap({
  sessions,
  period,
  routineNames = {},
  theme = 'default',
}: WorkoutActivityHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const heatmap = useMemo(
    () => buildActivityHeatmap(sessions, period),
    [sessions, period],
  );
  const intensityMap = theme === 'prime' ? INTENSITY_PRIME : INTENSITY_DEFAULT;

  const selectedSessions =
    selectedDate != null ? (heatmap.cellsByDate.get(selectedDate)?.sessions ?? []) : [];

  const toggleDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  if (period === 'week') {
    return (
      <WeekActivityView
        heatmap={heatmap}
        period={period}
        intensityMap={intensityMap}
        theme={theme}
        selectedDate={selectedDate}
        onSelectDate={toggleDate}
        selectedSessions={selectedSessions}
        routineNames={routineNames}
      />
    );
  }

  if (period === 'month') {
    return (
      <MonthActivityView
        heatmap={heatmap}
        period={period}
        intensityMap={intensityMap}
        theme={theme}
        selectedDate={selectedDate}
        onSelectDate={toggleDate}
        selectedSessions={selectedSessions}
        routineNames={routineNames}
      />
    );
  }

  const months = monthLabels(heatmap.weeks);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn(
            'text-sm font-medium',
            theme === 'prime' ? 'gp-mono gp-text-primary' : 'text-foreground',
          )}
        >
          {heatmap.workoutCount} entrenamiento{heatmap.workoutCount === 1 ? '' : 's'} ·{' '}
          {PERFORMANCE_PERIOD_LABELS[period].toLowerCase()}
        </p>
      </div>

      <div className="overflow-x-auto gp-scroll-thin">
        <div className="min-w-[280px]">
          <div
            className="mb-1 grid gap-1"
            style={{
              gridTemplateColumns: `2.5rem repeat(${heatmap.weeks.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {months.map((label, index) => (
              <div
                key={`month-${index}`}
                className={cn(
                  'text-[10px] uppercase',
                  theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
                )}
              >
                {label}
              </div>
            ))}
          </div>

          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `2.5rem repeat(${heatmap.weeks.length}, minmax(0, 1fr))`,
            }}
            role="grid"
            aria-label="Calendario de entrenamientos"
          >
            {DAY_LABELS.map((dayLabel, rowIndex) => (
              <div key={dayLabel} className="contents" role="row">
                <div
                  className={cn(
                    'flex items-center text-[10px]',
                    theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
                  )}
                  role="rowheader"
                >
                  {dayLabel}
                </div>
                {heatmap.weeks.map((week) => {
                  const cell = week.days[rowIndex];
                  if (!cell) {
                    return (
                      <div
                        key={`${week.weekStart}-${rowIndex}`}
                        className="aspect-square min-h-[12px] min-w-[12px]"
                        role="gridcell"
                        aria-hidden
                      />
                    );
                  }
                  const isSelected = selectedDate === cell.date;
                  return (
                    <button
                      key={`${week.weekStart}-${rowIndex}`}
                      type="button"
                      aria-label={cellAriaLabel(cell)}
                      title={cellAriaLabel(cell)}
                      onClick={() =>
                        toggleDate(cell.date)
                      }
                      className={cn(
                        'aspect-square min-h-[12px] min-w-[12px] rounded-sm border transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                        intensityMap[cell.level],
                        cell.hasFailures && cell.level > 0 && 'ring-1 ring-amber-400/80',
                        isSelected && 'ring-2 ring-cyan-400',
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center gap-2 text-xs',
          theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
        )}
      >
        <span>Volumen</span>
        <span className="ml-auto">Menos</span>
        {([1, 2, 3, 4] as HeatmapIntensity[]).map((level) => (
          <span
            key={level}
            className={cn('h-3 w-3 rounded-sm border', intensityMap[level])}
            aria-hidden
          />
        ))}
        <span>Más</span>
      </div>

      {selectedDate && (
        <div
          className={cn(
            'rounded-lg border p-4',
            theme === 'prime'
              ? 'gp-form-panel gp-border-outline/40'
              : 'border-border bg-card/50',
          )}
        >
          <AthleteSessionDayDetail
            date={selectedDate}
            sessions={selectedSessions}
            routineNames={routineNames}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}

type ActivityViewProps = {
  heatmap: ReturnType<typeof buildActivityHeatmap>;
  period: PerformancePeriod;
  intensityMap: Record<HeatmapIntensity, string>;
  theme: 'prime' | 'default';
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  selectedSessions: SessionLog[];
  routineNames: Record<string, string>;
};

function SessionDetailPanel({
  selectedDate,
  selectedSessions,
  routineNames,
  theme,
}: Pick<ActivityViewProps, 'selectedDate' | 'selectedSessions' | 'routineNames' | 'theme'>) {
  if (!selectedDate) return null;
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        theme === 'prime' ? 'gp-form-panel gp-border-outline/40' : 'border-border bg-card/50',
      )}
    >
      <AthleteSessionDayDetail
        date={selectedDate}
        sessions={selectedSessions}
        routineNames={routineNames}
        theme={theme}
      />
    </div>
  );
}

function WeekActivityView({
  heatmap,
  period,
  intensityMap,
  theme,
  selectedDate,
  onSelectDate,
  selectedSessions,
  routineNames,
}: ActivityViewProps) {
  const days = useMemo(
    () => Array.from(heatmap.cellsByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    [heatmap.cellsByDate],
  );

  return (
    <div className="space-y-4">
      <p
        className={cn(
          'text-sm font-medium',
          theme === 'prime' ? 'gp-mono gp-text-primary' : 'text-foreground',
        )}
      >
        {heatmap.workoutCount} entrenamiento{heatmap.workoutCount === 1 ? '' : 's'} ·{' '}
        {PERFORMANCE_PERIOD_LABELS[period].toLowerCase()}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7" role="list" aria-label="Actividad semanal">
        {days.map((cell) => {
          const date = new Date(`${cell.date}T12:00:00`);
          const weekdayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
          const isSelected = selectedDate === cell.date;
          return (
            <button
              key={cell.date}
              type="button"
              role="listitem"
              aria-label={cellAriaLabel(cell)}
              onClick={() => onSelectDate(cell.date)}
              className={cn(
                'flex min-h-[88px] flex-col items-center justify-center rounded-lg border p-3 transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                intensityMap[cell.level],
                cell.hasFailures && cell.level > 0 && 'ring-1 ring-amber-400/80',
                isSelected && 'ring-2 ring-cyan-400',
              )}
            >
              <span
                className={cn(
                  'text-[10px] uppercase',
                  theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
                )}
              >
                {DAY_LABELS[weekdayIndex]}
              </span>
              <span
                className={cn(
                  'mt-1 text-lg font-bold',
                  theme === 'prime' ? 'gp-mono gp-text-primary' : 'text-foreground',
                )}
              >
                {date.getDate()}
              </span>
              <span
                className={cn(
                  'mt-1 text-[10px]',
                  theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
                )}
              >
                {cell.level > 0 ? `${cell.sessions.length} sesión` : 'Descanso'}
              </span>
            </button>
          );
        })}
      </div>

      <SessionDetailPanel
        selectedDate={selectedDate}
        selectedSessions={selectedSessions}
        routineNames={routineNames}
        theme={theme}
      />
    </div>
  );
}

function MonthActivityView({
  heatmap,
  period,
  intensityMap,
  theme,
  selectedDate,
  onSelectDate,
  selectedSessions,
  routineNames,
}: ActivityViewProps) {
  return (
    <div className="space-y-4">
      <p
        className={cn(
          'text-sm font-medium',
          theme === 'prime' ? 'gp-mono gp-text-primary' : 'text-foreground',
        )}
      >
        {heatmap.workoutCount} entrenamiento{heatmap.workoutCount === 1 ? '' : 's'} ·{' '}
        {PERFORMANCE_PERIOD_LABELS[period].toLowerCase()}
      </p>

      <div className="overflow-x-auto gp-scroll-thin">
        <div className="min-w-[280px]">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className={cn(
                  'text-center text-[10px] uppercase',
                  theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
                )}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2" role="grid" aria-label="Calendario mensual de entrenamientos">
            {heatmap.weeks.flatMap((week) =>
              week.days.map((cell, index) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${week.weekStart}-${index}`}
                      className="min-h-[44px] min-w-[44px]"
                      aria-hidden
                    />
                  );
                }
                const dayNum = new Date(`${cell.date}T12:00:00`).getDate();
                const isSelected = selectedDate === cell.date;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    role="gridcell"
                    aria-label={cellAriaLabel(cell)}
                    onClick={() => onSelectDate(cell.date)}
                    className={cn(
                      'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-md border text-xs transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                      intensityMap[cell.level],
                      cell.hasFailures && cell.level > 0 && 'ring-1 ring-amber-400/80',
                      isSelected && 'ring-2 ring-cyan-400',
                    )}
                  >
                    <span className={cn('font-semibold', theme === 'prime' && 'gp-mono')}>{dayNum}</span>
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center gap-2 text-xs',
          theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
        )}
      >
        <span>Volumen</span>
        <span className="ml-auto">Menos</span>
        {([1, 2, 3, 4] as HeatmapIntensity[]).map((level) => (
          <span
            key={level}
            className={cn('h-3 w-3 rounded-sm border', intensityMap[level])}
            aria-hidden
          />
        ))}
        <span>Más</span>
      </div>

      <SessionDetailPanel
        selectedDate={selectedDate}
        selectedSessions={selectedSessions}
        routineNames={routineNames}
        theme={theme}
      />
    </div>
  );
}
