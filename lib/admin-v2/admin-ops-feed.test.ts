import { describe, expect, it } from 'vitest';
import {
  buildAdminActivityLog,
  buildAdminAlerts,
  countUnreadAlerts,
  type OpsFeedInput,
} from '@/lib/admin-v2/admin-ops-feed';
import type { Athlete, Trainer } from '@/lib/data/types';

const baseMetrics: OpsFeedInput['metrics'] = {
  memberships: { activeCount: 3, estimatedMrr: 90, mrrTrendPercent: 0 },
  capacity: { totalSlots: 20, currentLoad: 18, loadPercent: 90, trend7d: [] },
  retention: {
    atRisk: [
      {
        athleteId: 'a1',
        name: 'Ana',
        email: 'ana@test.com',
        reason: 'expiring',
        daysRemaining: 3,
      },
      {
        athleteId: 'a2',
        name: 'Luis',
        email: 'luis@test.com',
        reason: 'inactive',
        inactiveDays: 10,
      },
    ],
  },
  telemetry: {
    workoutsCompletedThisWeek: 12,
    metricsLoggedToday: 2,
    weeklyBars: [
      { day: 'L', count: 2 },
      { day: 'M', count: 0 },
    ],
  },
  operations: { unassigned: [{ id: 'u1', name: 'X', email: 'x@test.com', joinDate: '', priority: 'ALTA' }] },
};

const trainers: Trainer[] = [
  {
    id: 't1',
    name: 'Coach Full',
    email: 'c@test.com',
    specialization: 'Strength',
    athletes: 10,
    rating: 5,
    joinDate: '2024-01-01',
    isActive: true,
    maxAthletes: 10,
  },
  {
    id: 't2',
    name: 'Coach Pending',
    email: 'p@test.com',
    specialization: 'Cardio',
    athletes: 0,
    rating: 0,
    joinDate: '2024-06-01',
    invitePending: true,
  },
];

const athletes: Athlete[] = [
  {
    id: 'a3',
    name: 'Nuevo',
    email: 'n@test.com',
    age: 20,
    gender: 'male',
    weight: 70,
    height: 175,
    joinDate: new Date().toISOString(),
    membershipLevel: 'basic',
  },
];

function makeInput(overrides?: Partial<OpsFeedInput>): OpsFeedInput {
  return {
    metrics: baseMetrics,
    trainers,
    athletes,
    athletesWithoutTrainer: 4,
    ...overrides,
  };
}

describe('buildAdminAlerts', () => {
  it('includes critical unassigned and warning items', () => {
    const alerts = buildAdminAlerts(makeInput());

    expect(alerts.some((a) => a.id === 'unassigned-athletes' && a.severity === 'critical')).toBe(true);
    expect(alerts.some((a) => a.id === 'capacity-saturation')).toBe(true);
    expect(alerts.some((a) => a.id === 'trainer-capacity-t1')).toBe(true);
    expect(alerts.some((a) => a.id === 'trainer-invites-pending' && a.severity === 'info')).toBe(true);
  });

  it('sorts critical before warning and info', () => {
    const alerts = buildAdminAlerts(makeInput());
    expect(alerts[0]?.severity).toBe('critical');
  });
});

describe('countUnreadAlerts', () => {
  it('always counts critical alerts even after readAt', () => {
    const alerts = buildAdminAlerts(makeInput());
    const readAt = new Date().toISOString();
    const count = countUnreadAlerts(alerts, readAt);

    expect(count).toBeGreaterThanOrEqual(1);
    expect(alerts.filter((a) => a.severity === 'critical').length).toBeLessThanOrEqual(count);
  });

  it('hides warning and info after readAt when no critical', () => {
    const alerts = buildAdminAlerts(
      makeInput({
        athletesWithoutTrainer: 0,
        trainers: [],
        metrics: {
          ...baseMetrics,
          retention: { atRisk: [] },
          capacity: { totalSlots: 20, currentLoad: 5, loadPercent: 25, trend7d: [] },
        },
      }),
    );
    const readAt = new Date().toISOString();
    expect(countUnreadAlerts(alerts, readAt)).toBe(0);
  });
});

describe('buildAdminActivityLog', () => {
  it('includes telemetry, signups and operations snapshot', () => {
    const log = buildAdminActivityLog(makeInput());

    expect(log.some((i) => i.category === 'telemetry')).toBe(true);
    expect(log.some((i) => i.id === 'signup-a3')).toBe(true);
    expect(log.some((i) => i.isStateSnapshot && i.category === 'operations')).toBe(true);
  });
});
