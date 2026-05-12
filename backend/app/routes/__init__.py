from app.routes.auth import auth_bp
from app.routes.exercises import exercises_bp

# Importar otros blueprints cuando se creen
from flask import Blueprint

# Placeholder blueprints para las rutas que se crearán
users_bp = Blueprint('users', __name__)
routines_bp = Blueprint('routines', __name__)
memberships_bp = Blueprint('memberships', __name__)
metrics_bp = Blueprint('metrics', __name__)

# Health check placeholder
@users_bp.route('/', methods=['GET'])
def users_list():
    return {'message': 'Users endpoint - En desarrollo'}, 200

@routines_bp.route('/', methods=['GET'])
def routines_list():
    return {'message': 'Routines endpoint - En desarrollo'}, 200

@memberships_bp.route('/', methods=['GET'])
def memberships_list():
    return {'message': 'Memberships endpoint - En desarrollo'}, 200

@metrics_bp.route('/', methods=['GET'])
def metrics_list():
    return {'message': 'Metrics endpoint - En desarrollo'}, 200

__all__ = ['auth_bp', 'users_bp', 'exercises_bp', 'routines_bp', 'memberships_bp', 'metrics_bp']
