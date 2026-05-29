import type { MealSlot, MealSlotTimes } from './types';

export const DEFAULT_SLOT_TIMES: MealSlotTimes = {
  breakfast: '08:00',
  lunch: '13:30',
  snack: '17:00',
  dinner: '20:30',
};

export function createDefaultSlotTimes(): MealSlotTimes {
  return { ...DEFAULT_SLOT_TIMES };
}
