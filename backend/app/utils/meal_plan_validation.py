"""Validación mínima del shape de mealPlan al publicar."""

MEAL_SLOTS = frozenset({'breakfast', 'lunch', 'dinner', 'snack'})


def validate_meal_plan_shape(meal_plan: object) -> None:
    if not isinstance(meal_plan, dict):
        raise ValueError('mealPlan debe ser un objeto')

    days = meal_plan.get('days')
    if days is None:
        return
    if not isinstance(days, list):
        raise ValueError('mealPlan.days debe ser una lista')

    for index, day in enumerate(days):
        if not isinstance(day, dict):
            raise ValueError(f'mealPlan.days[{index}] debe ser un objeto')
        day_key = day.get('day', day.get('dayIndex'))
        if day_key is not None and not isinstance(day_key, int):
            raise ValueError(f'mealPlan.days[{index}].day debe ser un número')
        if day_key is not None and not 0 <= int(day_key) <= 6:
            raise ValueError(f'mealPlan.days[{index}].day debe estar entre 0 y 6')

        meals = day.get('meals')
        if meals is None:
            continue
        if isinstance(meals, list):
            for entry_index, entry in enumerate(meals):
                if not isinstance(entry, dict):
                    raise ValueError(
                        f'mealPlan.days[{index}].meals[{entry_index}] debe ser un objeto',
                    )
                slot = entry.get('slot')
                if slot is not None and slot not in MEAL_SLOTS:
                    raise ValueError(
                        f'mealPlan.days[{index}].meals[{entry_index}].slot inválido',
                    )
            continue
        if not isinstance(meals, dict):
            raise ValueError(f'mealPlan.days[{index}].meals debe ser un objeto o lista')
        for slot, value in meals.items():
            if slot not in MEAL_SLOTS:
                raise ValueError(f'mealPlan.days[{index}].meals contiene slot inválido: {slot}')
            if isinstance(value, list):
                for entry_index, entry in enumerate(value):
                    if not isinstance(entry, (dict, str)):
                        raise ValueError(
                            f'mealPlan.days[{index}].meals.{slot}[{entry_index}] inválido',
                        )
            elif not isinstance(value, str):
                raise ValueError(f'mealPlan.days[{index}].meals.{slot} debe ser lista o texto')
