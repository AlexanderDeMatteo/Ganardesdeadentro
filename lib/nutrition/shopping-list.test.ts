import { describe, expect, it } from 'vitest';
import { createDefaultSlotTimes } from './meal-schedule';
import { getBasicMealTemplates, getProMealTemplates } from './meal-plan';
import { buildWeeklyShoppingList } from './shopping-list';

describe('buildWeeklyShoppingList', () => {
  const slotTimes = createDefaultSlotTimes();
  const templates = [...getBasicMealTemplates(), ...getProMealTemplates()];

  it.each(templates.map((plan) => [plan.name, plan] as const))(
    'template %s has no pending gram quantities',
    (_name, plan) => {
      const items = buildWeeklyShoppingList(plan, slotTimes);
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((entry) => !entry.gramsPending)).toBe(true);
      expect(items.every((entry) => (entry.totalG ?? 0) > 0)).toBe(true);
    },
  );
});
