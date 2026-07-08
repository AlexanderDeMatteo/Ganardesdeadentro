import pytest

from app.utils.meal_plan_validation import validate_meal_plan_shape


def test_accepts_empty_meal_plan():
    validate_meal_plan_shape({})


def test_accepts_valid_object_shape():
    validate_meal_plan_shape({
        'id': 'plan-1',
        'name': 'Plan',
        'days': [
            {
                'day': 0,
                'meals': {
                    'breakfast': [{'id': '1', 'name': 'Avena', 'calories': 400}],
                    'lunch': [],
                    'dinner': [],
                    'snack': [],
                },
            }
        ],
    })


def test_rejects_invalid_meals_type():
    with pytest.raises(ValueError, match='debe ser un objeto o lista'):
        validate_meal_plan_shape({'days': [{'day': 0, 'meals': 42}]})
