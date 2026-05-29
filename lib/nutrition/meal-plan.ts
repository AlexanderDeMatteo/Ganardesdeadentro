import type { DayPlan, MealItem, MealPlan, MealSlot } from './types';

export function createMealItem(name: string, partial?: Partial<Omit<MealItem, 'id' | 'name'>>): MealItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    ...partial,
  };
}

export function emptyDayPlan(day: number): DayPlan {
  return {
    day,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
  };
}

export function createEmptyWeekPlan(name: string): MealPlan {
  return {
    id: `plan-${Date.now()}`,
    name,
    days: Array.from({ length: 7 }, (_, i) => emptyDayPlan(i)),
    createdAt: new Date().toISOString(),
  };
}

function dayWithMeals(
  day: number,
  meals: Partial<Record<MealSlot, MealItem[]>>,
): DayPlan {
  const base = emptyDayPlan(day);
  for (const slot of Object.keys(meals) as MealSlot[]) {
    if (meals[slot]) base.meals[slot] = meals[slot]!;
  }
  return base;
}

function sampleWeek(
  name: string,
  dailyMeals: Partial<Record<MealSlot, MealItem[]>>,
): MealPlan {
  return {
    id: `template-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name,
    days: Array.from({ length: 7 }, (_, i) => dayWithMeals(i, dailyMeals)),
    createdAt: new Date().toISOString(),
  };
}

/** Plantillas básicas (todos los usuarios). */
export function getBasicMealTemplates(): MealPlan[] {
  return [
    sampleWeek('Mantenimiento 2200', {
      breakfast: [
        createMealItem('Avena con plátano y miel', { calories: 420, proteinG: 12, carbsG: 68, fatG: 10, quantityG: 280 }),
        createMealItem('Café con leche', { calories: 80, proteinG: 4, carbsG: 8, fatG: 3, quantityG: 200 }),
      ],
      lunch: [
        createMealItem('Pollo a la plancha con arroz', { calories: 650, proteinG: 45, carbsG: 55, fatG: 18, quantityG: 450 }),
        createMealItem('Ensalada mixta', { calories: 120, proteinG: 3, carbsG: 10, fatG: 7, quantityG: 150 }),
      ],
      dinner: [
        createMealItem('Salmón con verduras', { calories: 520, proteinG: 38, carbsG: 20, fatG: 28, quantityG: 380 }),
      ],
      snack: [createMealItem('Yogur griego', { calories: 150, proteinG: 15, carbsG: 8, fatG: 5, quantityG: 170 })],
    }),
    sampleWeek('Definición 1800', {
      breakfast: [
        createMealItem('Tortilla de claras + pan integral', { calories: 320, proteinG: 28, carbsG: 30, fatG: 8 }),
      ],
      lunch: [
        createMealItem('Atún con ensalada', { calories: 450, proteinG: 42, carbsG: 15, fatG: 22 }),
      ],
      dinner: [
        createMealItem('Pechuga con brócoli', { calories: 380, proteinG: 40, carbsG: 12, fatG: 14 }),
      ],
      snack: [createMealItem('Manzana + almendras', { calories: 180, proteinG: 5, carbsG: 22, fatG: 9 })],
    }),
    sampleWeek('Volumen 2800', {
      breakfast: [
        createMealItem('Huevos revueltos + tostadas', { calories: 550, proteinG: 28, carbsG: 45, fatG: 28 }),
        createMealItem('Batido de proteína', { calories: 200, proteinG: 30, carbsG: 8, fatG: 4 }),
      ],
      lunch: [
        createMealItem('Carne magra con pasta', { calories: 780, proteinG: 48, carbsG: 85, fatG: 22 }),
      ],
      dinner: [
        createMealItem('Pavo con patata', { calories: 620, proteinG: 42, carbsG: 55, fatG: 20 }),
      ],
      snack: [
        createMealItem('Barrita energética', { calories: 250, proteinG: 10, carbsG: 35, fatG: 8 }),
        createMealItem('Plátano', { calories: 105, proteinG: 1, carbsG: 27, fatG: 0 }),
      ],
    }),
  ];
}

/** Plantillas Pro adicionales. */
export function getProMealTemplates(): MealPlan[] {
  return [
    sampleWeek('Alto rendimiento 3000', {
      breakfast: [
        createMealItem('Pancakes proteicos', { calories: 480, proteinG: 32, carbsG: 52, fatG: 16 }),
      ],
      lunch: [
        createMealItem('Ternera con quinoa', { calories: 850, proteinG: 55, carbsG: 70, fatG: 28 }),
      ],
      dinner: [
        createMealItem('Pescado blanco con boniato', { calories: 580, proteinG: 42, carbsG: 48, fatG: 18 }),
      ],
      snack: [
        createMealItem('Frutos secos', { calories: 220, proteinG: 6, carbsG: 8, fatG: 18 }),
        createMealItem('Batido post-entreno', { calories: 280, proteinG: 35, carbsG: 30, fatG: 4 }),
      ],
    }),
    sampleWeek('Vegetariano 2100', {
      breakfast: [
        createMealItem('Tofu scramble + aguacate', { calories: 400, proteinG: 22, carbsG: 18, fatG: 28 }),
      ],
      lunch: [
        createMealItem('Bowl de legumbres', { calories: 520, proteinG: 24, carbsG: 62, fatG: 16 }),
      ],
      dinner: [
        createMealItem('Curry de garbanzos', { calories: 480, proteinG: 18, carbsG: 55, fatG: 20 }),
      ],
      snack: [createMealItem('Hummus con zanahoria', { calories: 180, proteinG: 6, carbsG: 20, fatG: 9 })],
    }),
  ];
}

export function collectShoppingList(plan: MealPlan): string[] {
  const names = new Set<string>();
  for (const day of plan.days) {
    for (const slot of Object.values(day.meals)) {
      for (const item of slot) {
        const n = item.name.trim();
        if (n) names.add(n);
      }
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'es'));
}

export function duplicateDay(source: DayPlan): DayPlan {
  const cloneItems = (items: MealItem[]) =>
    items.map((i) => ({ ...i, id: createMealItem(i.name).id }));
  return {
    day: source.day,
    meals: {
      breakfast: cloneItems(source.meals.breakfast),
      lunch: cloneItems(source.meals.lunch),
      dinner: cloneItems(source.meals.dinner),
      snack: cloneItems(source.meals.snack),
    },
  };
}
