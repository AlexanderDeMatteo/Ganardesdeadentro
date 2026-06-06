import re
from datetime import datetime

EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
ISO_DATE_PATTERN = re.compile(r'^\d{4}-\d{2}-\d{2}$')

ACTIVITY_LEVELS = {'sedentary', 'light', 'moderate', 'active', 'very_active'}
NUTRITION_GOALS = {'lose', 'maintain', 'gain'}
SESSION_OUTCOMES = {'completed', 'partial', 'skipped'}
SET_RESULTS = {'completed', 'failed', 'skipped'}


def validate_email(email: str) -> str | None:
    if not email or not isinstance(email, str):
        return 'Email inválido'
    normalized = email.strip().lower()
    if not EMAIL_PATTERN.match(normalized):
        return 'Email inválido'
    return None


def validate_iso_date(value: str, field_name: str = 'fecha') -> str | None:
    if not value or not isinstance(value, str):
        return f'{field_name} inválida'
    if not ISO_DATE_PATTERN.match(value):
        return f'{field_name} inválida'
    try:
        datetime.strptime(value, '%Y-%m-%d')
    except ValueError:
        return f'{field_name} inválida'
    return None
