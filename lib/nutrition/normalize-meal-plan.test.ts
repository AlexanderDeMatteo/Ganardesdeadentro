import { describe, expect, it } from 'vitest';
import { normalizeMealPlan } from '@/lib/nutrition/normalize-meal-plan';

describe('normalizeMealPlan', () => {
  it('converts legacy seed shape to canonical meal slots', () => {
    const normalized = normalizeMealPlan({
      id: 'plan-1',
      name: 'Plan test',
      days: [
        {
          dayIndex: 0,
          meals: [
            { slot: 'breakfast', name: 'Avena', calories: 400 },
            { slot: 'lunch', name: 'Pollo', calories: 650 },
          ],
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(normalized.days[0].day).toBe(0);
    expect(normalized.days[0].meals.breakfast).toHaveLength(1);
    expect(normalized.days[0].meals.breakfast[0].name).toBe('Avena');
    expect(normalized.days[0].meals.snack).toEqual([]);
  });
});
