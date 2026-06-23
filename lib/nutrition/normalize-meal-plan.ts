import type { DayPlan, MealItem, MealPlan, MealSlot } from './types';

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function emptySlotMap(): Record<MealSlot, MealItem[]> {
  return {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
}

function toMealItem(raw: unknown, index: number): MealItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  if (!name) return null;
  const id =
    typeof o.id === 'string' && o.id
      ? o.id
      : `item-${index}-${name.replace(/\s+/g, '-').toLowerCase()}`;
  return {
    id,
    name,
    calories: typeof o.calories === 'number' ? o.calories : undefined,
    proteinG: typeof o.proteinG === 'number' ? o.proteinG : undefined,
    carbsG: typeof o.carbsG === 'number' ? o.carbsG : undefined,
    fatG: typeof o.fatG === 'number' ? o.fatG : undefined,
    quantityG: typeof o.quantityG === 'number' ? o.quantityG : undefined,
    scheduledTime: typeof o.scheduledTime === 'string' ? o.scheduledTime : undefined,
    notes: typeof o.notes === 'string' ? o.notes : undefined,
  };
}

function normalizeMeals(raw: unknown): Record<MealSlot, MealItem[]> {
  const result = emptySlotMap();

  if (Array.isArray(raw)) {
    let idx = 0;
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue;
      const o = entry as Record<string, unknown>;
      const slot = o.slot as MealSlot;
      if (!MEAL_SLOTS.includes(slot)) continue;
      const item = toMealItem(entry, idx++);
      if (item) result[slot].push(item);
    }
    return result;
  }

  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const slot of MEAL_SLOTS) {
      const value = o[slot];
      if (Array.isArray(value)) {
        let idx = 0;
        for (const entry of value) {
          const item = toMealItem(entry, idx++);
          if (item) result[slot].push(item);
        }
      } else if (typeof value === 'string' && value.trim()) {
        result[slot].push({
          id: `legacy-${slot}`,
          name: value.trim(),
        });
      }
    }
  }

  return result;
}

function normalizeDay(raw: unknown, index: number): DayPlan {
  if (!raw || typeof raw !== 'object') {
    return { day: index, meals: emptySlotMap() };
  }
  const o = raw as Record<string, unknown>;
  const day =
    typeof o.day === 'number'
      ? o.day
      : typeof o.dayIndex === 'number'
        ? o.dayIndex
        : index;
  return {
    day: Math.max(0, Math.min(6, day)),
    meals: normalizeMeals(o.meals),
  };
}

export function normalizeMealPlan(raw: unknown): MealPlan {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 'empty',
      name: 'Plan',
      days: [],
      createdAt: new Date().toISOString(),
    };
  }

  const o = raw as Record<string, unknown>;
  const days = Array.isArray(o.days) ? o.days.map((d, i) => normalizeDay(d, i)) : [];

  return {
    id: typeof o.id === 'string' ? o.id : 'plan',
    name: typeof o.name === 'string' ? o.name : 'Plan de comidas',
    days,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
  };
}

export function getMealSlotItems(
  meals: DayPlan['meals'] | undefined,
  slot: MealSlot,
): MealItem[] {
  if (!meals || typeof meals !== 'object') return [];
  const items = meals[slot];
  return Array.isArray(items) ? items : [];
}
