from functools import wraps

from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request

from app.database import SessionLocal
from app.models import RoleEnum, User


def get_current_user_id() -> int:
    return int(get_jwt_identity())


def get_current_role() -> str:
    return get_jwt().get('role', 'user')


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            if get_current_role() not in roles:
                return {'error': 'No tienes permisos para esta acción'}, 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def _get_user(session, user_id: int) -> User | None:
    return session.query(User).filter_by(id=user_id).first()


def can_access_athlete(athlete_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        current_id = get_current_user_id()
        role = get_current_role()
        if role == RoleEnum.ADMIN.value:
            return True
        if role == RoleEnum.USER.value and current_id == athlete_id:
            return True
        if role == RoleEnum.TRAINER.value:
            athlete = _get_user(session, athlete_id)
            return athlete is not None and athlete.trainer_id == current_id
        return False
    finally:
        if close_session:
            session.close()


def require_athlete_access(athlete_id: int, session=None):
    if not can_access_athlete(athlete_id, session=session):
        return {'error': 'No tienes permisos para acceder a este atleta'}, 403
    return None


def can_manage_athlete(athlete_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        role = get_current_role()
        if role == RoleEnum.ADMIN.value:
            return True
        if role == RoleEnum.TRAINER.value:
            athlete = _get_user(session, athlete_id)
            return athlete is not None and athlete.trainer_id == get_current_user_id()
        return False
    finally:
        if close_session:
            session.close()


def require_manage_athlete(athlete_id: int, session=None):
    if not can_manage_athlete(athlete_id, session=session):
        return {'error': 'No tienes permisos para gestionar este atleta'}, 403
    return None


def can_edit_trainer_profile(trainer_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        role = get_current_role()
        if role == RoleEnum.ADMIN.value:
            return True
        return role == RoleEnum.TRAINER.value and get_current_user_id() == trainer_id
    finally:
        if close_session:
            session.close()


def require_trainer_profile_access(trainer_id: int, session=None):
    if not can_edit_trainer_profile(trainer_id, session=session):
        return {'error': 'No tienes permisos para editar este perfil'}, 403
    return None
