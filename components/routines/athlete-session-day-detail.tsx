'use client';

import { useState } from 'react';
import type { SessionLog } from '@/lib/data/types';
import { formatHeatmapDateLabel } from '@/lib/workout/activity-heatmap';
import { cn } from '@/lib/utils';

type AthleteSessionDayDetailProps = {
  date: string;
  sessions: SessionLog[];
  routineNames?: Record<string, string>;
  theme?: 'prime' | 'default';
};

export function AthleteSessionDayDetail({
  date,
  sessions,
  routineNames = {},
  theme = 'default',
}: AthleteSessionDayDetailProps) {
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id ?? '');

  if (sessions.length === 0) {
    return (
      <p
        className={cn(
          'text-sm',
          theme === 'prime' ? 'gp-mono gp-text-muted' : 'text-muted-foreground',
        )}
      >
        Sin entrenamientos registrados en esta fecha.
      </p>
    );
  }

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? sessions[0];

  const pct =
    activeSession.totalSets > 0
      ? Math.round(((activeSession.completedSets ?? 0) / activeSession.totalSets) * 100)
      : 0;

  return (
    <div className="space-y-3">
      <div>
        <p
          className={cn(
            'font-semibold',
            theme === 'prime' ? 'gp-mono gp-text-primary' : 'text-foreground',
          )}
        >
          {formatHeatmapDateLabel(date)}
        </p>
        <p
          className={cn(
            'text-xs',
            theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
          )}
        >
          {routineNames[activeSession.routineId] ?? 'Rutina'} · {pct}% completado
          {(activeSession.failedSets ?? 0) > 0 && (
            <span className="text-amber-400"> · {activeSession.failedSets} fallos</span>
          )}
        </p>
      </div>

      {sessions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setActiveSessionId(session.id)}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                theme === 'prime' ? 'gp-mono' : '',
                activeSession.id === session.id
                  ? theme === 'prime'
                    ? 'bg-[#68ca62]/20 text-[#83e77b]'
                    : 'bg-primary/20 text-primary'
                  : theme === 'prime'
                    ? 'gp-border-outline border gp-text-dim'
                    : 'border border-border text-muted-foreground',
              )}
            >
              Sesión {session.id.slice(-4)}
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-2">
        {(activeSession.setLogs ?? []).map((set) => (
          <li
            key={`${set.exerciseId}-${set.setNumber}`}
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm',
              theme === 'prime'
                ? 'gp-border-outline/40 gp-bg-surface-high/40'
                : 'border-border bg-card/50',
              set.result === 'failed' && 'border-amber-400/40 bg-amber-400/5',
            )}
          >
            <span className={theme === 'prime' ? 'gp-mono gp-text-primary' : 'font-medium'}>
              {set.exerciseName} · serie {set.setNumber}
            </span>
            <span
              className={cn(
                'text-xs',
                theme === 'prime' ? 'gp-mono gp-text-dim' : 'text-muted-foreground',
                set.result === 'failed' && 'text-amber-400',
              )}
            >
              {set.repsLogged ?? set.repsTarget}/{set.repsTarget} reps
              {set.weightKg != null ? ` · ${set.weightKg} kg` : ''}
              {set.result === 'failed' ? ' · Me rindo' : ''}
            </span>
            {set.executionVideoUrl ? (
              <video
                src={set.executionVideoUrl}
                controls
                className="mt-2 w-full max-w-xs rounded-md border gp-border-outline/40"
                preload="metadata"
              >
                <track kind="captions" />
              </video>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
