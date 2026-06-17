import { describe, expect, it } from 'vitest';
import {
  filterMetricsByPeriod,
  metricsToChartData,
  summarizeSessionPerformance,
} from '@/lib/admin-v2/athlete-performance';
import type { Metric, SessionLog } from '@/lib/data/types';

const reference = new Date('2026-06-14T12:00:00');

describe('athlete-performance', () => {
  it('filters metrics to weekly window', () => {
    const metrics: Metric[] = [
      { id: '1', athleteId: 'a1', date: '2026-06-01', weight: 80 },
      { id: '2', athleteId: 'a1', date: '2026-06-10', weight: 79 },
      { id: '3', athleteId: 'a1', date: '2026-06-13', weight: 78.5 },
    ];

    const weekly = filterMetricsByPeriod(metrics, 'week', reference);
    expect(weekly).toHaveLength(2);
    expect(weekly.map((m) => m.id)).toEqual(['2', '3']);
  });

  it('builds chart data for monthly period', () => {
    const metrics: Metric[] = [
      { id: '1', athleteId: 'a1', date: '2026-05-20', weight: 82 },
      { id: '2', athleteId: 'a1', date: '2026-06-10', weight: 80 },
    ];

    const data = metricsToChartData(metrics, 'weight', 'month');
    expect(data).toHaveLength(2);
    expect(data[1]?.value).toBe(80);
  });

  it('summarizes session adherence', () => {
    const sessions: SessionLog[] = [
      {
        id: '1',
        athleteId: 'a1',
        routineId: 'r1',
        scheduledDate: '2026-06-10',
        date: '2026-06-10',
        setLogs: [],
        completed: true,
        completedSets: 12,
        failedSets: 0,
        totalSets: 12,
        sessionOutcome: 'completed',
      },
      {
        id: '2',
        athleteId: 'a1',
        routineId: 'r1',
        scheduledDate: '2026-06-12',
        date: '2026-06-12',
        setLogs: [],
        completed: false,
        completedSets: 4,
        failedSets: 2,
        totalSets: 10,
        sessionOutcome: 'abandoned',
      },
    ];

    const summary = summarizeSessionPerformance(sessions);
    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.adherencePct).toBe(50);
    expect(summary.completedSets).toBe(16);
  });
});
