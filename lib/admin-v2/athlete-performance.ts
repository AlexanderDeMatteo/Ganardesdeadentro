import type { Metric, SessionLog } from '@/lib/data/types';

export type PerformancePeriod = 'week' | 'month' | 'year';

export const PERFORMANCE_PERIOD_LABELS: Record<PerformancePeriod, string> = {
  week: 'Semanal',
  month: 'Mensual',
  year: 'Anual',
};

const PERIOD_DAYS: Record<PerformancePeriod, number> = {
  week: 7,
  month: 30,
  year: 365,
};

export function getPeriodStart(period: PerformancePeriod, reference = new Date()): Date {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (PERIOD_DAYS[period] - 1));
  return start;
}

function parseDate(value: string): Date {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  return date;
}

function isWithinPeriod(dateValue: string, period: PerformancePeriod, reference = new Date()): boolean {
  const date = parseDate(dateValue);
  const start = getPeriodStart(period, reference);
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export function filterMetricsByPeriod(
  metrics: Metric[],
  period: PerformancePeriod,
  reference = new Date(),
): Metric[] {
  return metrics
    .filter((entry) => isWithinPeriod(entry.date, period, reference))
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
}

export function filterSessionsByPeriod(
  sessions: SessionLog[],
  period: PerformancePeriod,
  reference = new Date(),
): SessionLog[] {
  return sessions
    .filter((session) => isWithinPeriod(session.date, period, reference))
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
}

export type MetricField = 'weight' | 'bodyFat' | 'muscleMass';

export type PerformanceChartPoint = {
  date: string;
  value: number;
  fullDate: string;
};

function formatChartLabel(dateValue: string, period: PerformancePeriod): string {
  const date = parseDate(dateValue);
  if (period === 'week') {
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  }
  if (period === 'month') {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

function bucketMetricsByMonth(metrics: Metric[], field: MetricField): Metric[] {
  const buckets = new Map<string, Metric>();
  for (const entry of metrics) {
    const key = entry.date.slice(0, 7);
    buckets.set(key, entry);
  }
  return Array.from(buckets.values()).sort(
    (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime(),
  );
}

export function metricsToChartData(
  metrics: Metric[],
  field: MetricField,
  period: PerformancePeriod,
  reference = new Date(),
): PerformanceChartPoint[] {
  const scoped = filterMetricsByPeriod(metrics, period, reference);
  const source = period === 'year' && scoped.length > 14 ? bucketMetricsByMonth(scoped, field) : scoped;

  return source
    .filter((entry) => typeof entry[field] === 'number')
    .map((entry) => ({
      date: formatChartLabel(entry.date, period),
      value: entry[field] as number,
      fullDate: entry.date,
    }));
}

export function computePeriodDelta(
  metrics: Metric[],
  field: MetricField,
  period: PerformancePeriod,
  reference = new Date(),
): number | null {
  const scoped = filterMetricsByPeriod(metrics, period, reference);
  if (scoped.length < 2) return null;
  const first = scoped[0][field];
  const last = scoped[scoped.length - 1][field];
  if (typeof first !== 'number' || typeof last !== 'number') return null;
  return Number((last - first).toFixed(1));
}

export type SessionPerformanceSummary = {
  total: number;
  completed: number;
  abandoned: number;
  adherencePct: number | null;
  completedSets: number;
  failedSets: number;
};

export function summarizeSessionPerformance(sessions: SessionLog[]): SessionPerformanceSummary {
  const completed = sessions.filter((s) => s.sessionOutcome === 'completed').length;
  const abandoned = sessions.filter((s) => s.sessionOutcome === 'abandoned').length;
  const total = sessions.length;

  return {
    total,
    completed,
    abandoned,
    adherencePct: total > 0 ? Math.round((completed / total) * 100) : null,
    completedSets: sessions.reduce((sum, s) => sum + (s.completedSets ?? 0), 0),
    failedSets: sessions.reduce((sum, s) => sum + (s.failedSets ?? 0), 0),
  };
}

export function formatDelta(value: number | null, unit: string): string {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value} ${unit}`;
}
