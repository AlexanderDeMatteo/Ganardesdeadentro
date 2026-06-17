import type { PerformancePeriod } from '@/lib/admin-v2/athlete-performance';
import { getPeriodStart } from '@/lib/admin-v2/athlete-performance';
import type { SessionLog } from '@/lib/data/types';

export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4;

export type HeatmapDayCell = {
  date: string;
  level: HeatmapIntensity;
  sessions: SessionLog[];
  volume: number;
  hasFailures: boolean;
};

export type HeatmapWeekColumn = {
  weekStart: string;
  days: (HeatmapDayCell | null)[];
};

export type ActivityHeatmapData = {
  weeks: HeatmapWeekColumn[];
  workoutCount: number;
  cellsByDate: Map<string, HeatmapDayCell>;
};

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export { DAY_LABELS };

function sessionDateKey(session: SessionLog): string {
  return session.scheduledDate || session.date.slice(0, 10);
}

function parseReps(value?: string): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sessionVolume(session: SessionLog): number {
  let volume = 0;
  for (const set of session.setLogs ?? []) {
    const reps = parseReps(set.repsLogged ?? set.repsTarget);
    if (set.weightKg != null && set.weightKg > 0) {
      volume += set.weightKg * reps;
    } else {
      volume += reps;
    }
  }
  if (volume > 0) return volume;
  return session.completedSets > 0 ? session.completedSets : 1;
}

function sessionHasFailures(session: SessionLog): boolean {
  if ((session.failedSets ?? 0) > 0) return true;
  return (session.setLogs ?? []).some((set) => set.result === 'failed');
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonday(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function volumeToLevel(volume: number, maxVolume: number): HeatmapIntensity {
  if (volume <= 0) return 0;
  const ratio = volume / Math.max(maxVolume, 1);
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export function buildActivityHeatmap(
  sessions: SessionLog[],
  period: PerformancePeriod,
  reference = new Date(),
): ActivityHeatmapData {
  const start = getPeriodStart(period, reference);
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);

  const sessionsByDate = new Map<string, SessionLog[]>();
  for (const session of sessions) {
    const key = sessionDateKey(session);
    const sessionDate = new Date(`${key}T12:00:00`);
    if (sessionDate < start || sessionDate > end) continue;
    const bucket = sessionsByDate.get(key) ?? [];
    bucket.push(session);
    sessionsByDate.set(key, bucket);
  }

  const dayVolumes: number[] = [];
  for (const [, daySessions] of sessionsByDate) {
    dayVolumes.push(daySessions.reduce((sum, s) => sum + sessionVolume(s), 0));
  }
  const maxVolume = Math.max(...dayVolumes, 1);

  const cellsByDate = new Map<string, HeatmapDayCell>();
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);

  while (cursor <= end) {
    const dateStr = toDateKey(cursor);
    const daySessions = sessionsByDate.get(dateStr) ?? [];
    if (daySessions.length === 0) {
      cellsByDate.set(dateStr, {
        date: dateStr,
        level: 0,
        sessions: [],
        volume: 0,
        hasFailures: false,
      });
    } else {
      const volume = daySessions.reduce((sum, s) => sum + sessionVolume(s), 0);
      cellsByDate.set(dateStr, {
        date: dateStr,
        level: volumeToLevel(volume, maxVolume),
        sessions: daySessions,
        volume,
        hasFailures: daySessions.some(sessionHasFailures),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: HeatmapWeekColumn[] = [];
  let weekMonday = getMonday(start);

  while (weekMonday <= end) {
    const days: (HeatmapDayCell | null)[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(weekMonday);
      day.setDate(day.getDate() + offset);
      day.setHours(12, 0, 0, 0);
      if (day < start || day > end) {
        days.push(null);
      } else {
        const dateStr = toDateKey(day);
        days.push(
          cellsByDate.get(dateStr) ?? {
            date: dateStr,
            level: 0,
            sessions: [],
            volume: 0,
            hasFailures: false,
          },
        );
      }
    }
    weeks.push({ weekStart: toDateKey(weekMonday), days });
    weekMonday.setDate(weekMonday.getDate() + 7);
  }

  const workoutCount = sessions.filter((session) => {
    const key = sessionDateKey(session);
    const sessionDate = new Date(`${key}T12:00:00`);
    return sessionDate >= start && sessionDate <= end;
  }).length;

  return { weeks, workoutCount, cellsByDate };
}

export function formatHeatmapDateLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
