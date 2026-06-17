import { describe, expect, it } from 'vitest';
import type { SessionLog } from '@/lib/data/types';
import { buildActivityHeatmap, sessionVolume } from '@/lib/workout/activity-heatmap';

function makeSession(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: '1',
    athleteId: '1',
    routineId: '10',
    scheduledDate: '2026-06-15',
    date: '2026-06-15T18:00:00Z',
    setLogs: [
      {
        exerciseId: 'squat',
        exerciseName: 'Sentadilla',
        setNumber: 1,
        repsTarget: '10',
        repsLogged: '10',
        weightKg: 100,
        result: 'completed',
      },
    ],
    completed: true,
    completedSets: 1,
    failedSets: 0,
    totalSets: 1,
    sessionOutcome: 'completed',
    ...overrides,
  };
}

describe('activity-heatmap', () => {
  it('calculates session volume from weight and reps', () => {
    expect(sessionVolume(makeSession())).toBe(1000);
  });

  it('marks days with sessions in heatmap', () => {
    const reference = new Date('2026-06-15T12:00:00');
    const heatmap = buildActivityHeatmap([makeSession()], 'week', reference);
    const cell = heatmap.cellsByDate.get('2026-06-15');
    expect(cell?.level).toBeGreaterThan(0);
    expect(heatmap.workoutCount).toBe(1);
  });

  it('flags days with failed sets', () => {
    const reference = new Date('2026-06-15T12:00:00');
    const heatmap = buildActivityHeatmap(
      [
        makeSession({
          failedSets: 1,
          setLogs: [
            {
              exerciseId: 'squat',
              exerciseName: 'Sentadilla',
              setNumber: 1,
              repsTarget: '10',
              repsLogged: '4',
              weightKg: 80,
              result: 'failed',
            },
          ],
        }),
      ],
      'week',
      reference,
    );
    expect(heatmap.cellsByDate.get('2026-06-15')?.hasFailures).toBe(true);
  });
});
