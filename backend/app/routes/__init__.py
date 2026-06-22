from app.routes.admin import admin_bp
from app.routes.auth import auth_bp
from app.routes.exchange_rates import exchange_rates_bp
from app.routes.exercises import exercises_bp
from app.routes.memberships import memberships_bp
from app.routes.metrics import metrics_bp
from app.routes.notifications import notifications_bp
from app.routes.nutrition import nutrition_bp
from app.routes.payments import payments_bp
from app.routes.routines import routines_bp
from app.routes.sessions import sessions_bp
from app.routes.support import support_bp
from app.routes.users import users_bp

__all__ = [
    'auth_bp',
    'users_bp',
    'exchange_rates_bp',
    'exercises_bp',
    'routines_bp',
    'memberships_bp',
    'metrics_bp',
    'sessions_bp',
    'nutrition_bp',
    'admin_bp',
    'payments_bp',
    'notifications_bp',
    'support_bp',
]
