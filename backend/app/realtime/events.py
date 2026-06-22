import logging

from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import disconnect, join_room, leave_room

from app.database import SessionLocal
from app.extensions import socketio
from app.models import RoleEnum, User
logger = logging.getLogger(__name__)


def _role_value(role) -> str:
    return role.value if hasattr(role, 'value') else str(role)


def _authenticate_socket(auth) -> User | None:
    token = None
    if isinstance(auth, dict):
        token = auth.get('token')
    if not token:
        return None
    try:
        decoded = decode_token(token)
        user_id = int(decoded['sub'])
    except Exception:
        logger.debug('Socket auth: invalid token')
        return None

    session = SessionLocal()
    try:
        user = session.query(User).filter_by(id=user_id).first()
        if user is None or not user.is_active:
            return None
        return user
    finally:
        session.close()


@socketio.on('connect')
def handle_connect(auth):
    user = _authenticate_socket(auth)
    if user is None:
        return False

    join_room(f'user:{user.id}')
    if _role_value(user.role) == RoleEnum.ADMIN.value:
        join_room('role:admin')

    request.environ['socket_user_id'] = user.id
    request.environ['socket_user_role'] = _role_value(user.role)
    return True


@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.environ.get('socket_user_id')
    role = request.environ.get('socket_user_role')
    if user_id is not None:
        leave_room(f'user:{user_id}')
    if role == RoleEnum.ADMIN.value:
        leave_room('role:admin')


def _can_join_support_thread(user_id: int, role: str, athlete_id: int, session) -> bool:
    """Authorize support room join using socket session (no Flask JWT context)."""
    if role == RoleEnum.USER.value:
        return athlete_id == user_id
    if role == RoleEnum.ADMIN.value:
        return True
    if role == RoleEnum.TRAINER.value:
        athlete = session.query(User).filter_by(id=athlete_id).first()
        return athlete is not None and athlete.trainer_id == user_id
    return False


@socketio.on('support:join')
def handle_support_join(data):
    user_id = request.environ.get('socket_user_id')
    role = request.environ.get('socket_user_role')
    if user_id is None or role is None:
        disconnect()
        return

    athlete_id = data.get('athleteId') if isinstance(data, dict) else None
    try:
        athlete_id_int = int(athlete_id)
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return

    session = SessionLocal()
    try:
        if not _can_join_support_thread(user_id_int, role, athlete_id_int, session):
            return
    finally:
        session.close()

    join_room(f'support:{athlete_id_int}')


@socketio.on('support:leave')
def handle_support_leave(data):
    athlete_id = data.get('athleteId') if isinstance(data, dict) else None
    try:
        athlete_id_int = int(athlete_id)
    except (TypeError, ValueError):
        return
    leave_room(f'support:{athlete_id_int}')


def register_socket_events():
    """Handlers are registered via decorators on import."""
