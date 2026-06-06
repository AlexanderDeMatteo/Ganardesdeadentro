from flask import Blueprint, current_app, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.extensions import limiter
from app.services.auth_service import AuthService


auth_bp = Blueprint('auth', __name__)


def _role_value(role) -> str:
    return role.value if hasattr(role, 'value') else str(role)


def _auth_rate_limit():
    return current_app.config.get('AUTH_RATE_LIMIT', '10 per minute')


@auth_bp.route('/register', methods=['POST'])
@limiter.limit(_auth_rate_limit)
def register():
    """Registra un nuevo usuario."""
    data = request.get_json() or {}

    required_fields = ['email', 'password', 'first_name', 'last_name']
    if not all(field in data for field in required_fields):
        return {
            'error': 'Faltan campos requeridos',
            'required': required_fields,
        }, 400

    user, error = AuthService.create_user(
        email=data['email'],
        password=data['password'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        role='user',
    )

    if error:
        return {'error': error}, 400

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'email': user.email,
            'role': _role_value(user.role),
        },
    )

    return {
        'message': 'Usuario registrado exitosamente',
        'access_token': access_token,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': _role_value(user.role),
        },
    }, 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit(_auth_rate_limit)
def login():
    """Autentica un usuario."""
    data = request.get_json() or {}

    if not data.get('email') or not data.get('password'):
        return {'error': 'Email y contraseña son requeridos'}, 400

    user, error = AuthService.authenticate_user(
        email=data['email'],
        password=data['password'],
    )

    if error:
        return {'error': error}, 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'email': user.email,
            'role': _role_value(user.role),
        },
    )

    return {
        'message': 'Autenticación exitosa',
        'access_token': access_token,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': _role_value(user.role),
        },
    }, 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Obtiene la información del usuario actual."""
    user_id = int(get_jwt_identity())
    user = AuthService.get_user_by_id(user_id)

    if not user:
        return {'error': 'Usuario no encontrado'}, 404

    if not user.is_active:
        return {'error': 'La cuenta ha sido desactivada'}, 401

    return {
        'user': {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': _role_value(user.role),
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None,
        },
    }, 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
@limiter.limit(_auth_rate_limit)
def change_password():
    """Cambia la contraseña del usuario."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    if not data.get('old_password') or not data.get('new_password'):
        return {'error': 'Contraseñas requeridas'}, 400

    success, error = AuthService.change_password(
        user_id=user_id,
        old_password=data['old_password'],
        new_password=data['new_password'],
    )

    if not success:
        return {'error': error}, 400

    return {'message': 'Contraseña cambiada exitosamente'}, 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout del usuario (principalmente para limpiar en el cliente)."""
    return {'message': 'Sesión cerrada'}, 200
