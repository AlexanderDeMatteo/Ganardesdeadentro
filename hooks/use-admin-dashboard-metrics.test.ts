import { describe, expect, it } from 'vitest';
import { buildFallbackMetrics } from '@/hooks/use-admin-dashboard-metrics';
import type { Athlete, Trainer } from '@/lib/data/types';

const athletes: Athlete[] = [
  {
    id: '1',
    name: 'Ana Pro',
    email: 'ana@example.com',
    age: 28,
    gender: 'female',
    weight: 60,
    height: 165,
    joinDate: '2025-01-01T00:00:00.000Z',
    trainerId: null,
    membershipLevel: 'pro',
  },
  {
    id: '2',
    name: 'Luis Premium',
    email: 'luis@example.com',
    age: 32,
    gender: 'male',
    weight: 80,
    height: 180,
    joinDate: '2025-02-01T00:00:00.000Z',
    trainerId: 't1',
    membershipLevel: 'premium',
  },
  {
    id: '3',
    name: 'Marta Basic',
    email: 'marta@example.com',
    age: 25,
    gender: 'female',
    weight: 55,
    height: 160,
    joinDate: '2025-03-01T00:00:00.000Z',
    trainerId: null,
    membershipLevel: 'basic',
  },
];

const trainers: Trainer[] = [
  {
    id: 't1',
    name: 'Coach One',
    email: 'coach@example.com',
    specialization: 'Strength',
    athletes: 1,
    rating: 4.5,
    joinDate: '2024-01-01T00:00:00.000Z',
    isActive: true,
    invitePending: false,
    maxAthletes: 10,
  },
];

describe('buildFallbackMetrics', () => {
  it('maps unassigned athletes to operation priorities', () => {
    const metrics = buildFallbackMetrics(athletes, trainers);

    expect(metrics.operations.unassigned).toHaveLength(2);
    expect(metrics.operations.unassigned.find((row) => row.id === '1')?.priority).toBe('ALTA');
    expect(metrics.operations.unassigned.find((row) => row.id === '3')?.priority).toBe('BAJA');
  });

  it('computes capacity load from trainer maxAthletes', () => {
    const metrics = buildFallbackMetrics(athletes, trainers);

    expect(metrics.capacity.totalSlots).toBe(10);
    expect(metrics.capacity.currentLoad).toBe(1);
    expect(metrics.capacity.loadPercent).toBe(10);
  });

  it('returns telemetry weekly bars with seven entries', () => {
    const metrics = buildFallbackMetrics(athletes, trainers);

    expect(metrics.telemetry.weeklyBars).toHaveLength(7);
    expect(metrics.capacity.trend7d).toHaveLength(7);
  });
});
