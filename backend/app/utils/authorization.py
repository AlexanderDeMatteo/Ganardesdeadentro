import json
from functools import wraps

from flask_jwt_extended import current_user, get_jwt, get_jwt_identity, verify_jwt_in_request

from app.database import SessionLocal
from app.models import RoleEnum, Routine, User, UserRoutineAssignment, WeeklyPlan


def get_current_user_id() -> int:
    return int(get_jwt_identity())


def _role_value(role) -> str:
    return role.value if hasattr(role, 'value') else str(role)


def get_verified_user(session=None) -> User | None:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        if current_user and isinstance(current_user, User):
            if not current_user.is_active:
                return None
            return current_user
        user_id = get_current_user_id()
        user = session.query(User).filter_by(id=user_id).first()
        if user is None or not user.is_active:
            return None
        return user
    finally:
        if close_session:
            session.close()


def get_current_role() -> str:
    user = get_verified_user()
    if user is not None:
        return _role_value(user.role)
    return get_jwt().get('role', 'user')


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = get_verified_user()
            if user is None:
                return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
            if _role_value(user.role) not in roles:
                return {'error': 'No tienes permisos para esta acción'}, 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def can_manage_custom_exercise(user: User, exercise) -> bool:
    """Admin puede gestionar cualquier custom; trainer solo los que creó."""
    role = _role_value(user.role)
    if role == RoleEnum.ADMIN.value:
        return bool(exercise.is_custom)
    if role == RoleEnum.TRAINER.value:
        return bool(exercise.is_custom) and exercise.created_by_id == user.id
    return False


def _get_custom_exercise_or_forbidden(session, exercise_id: str, user: User):
    from app.models import Exercise

    exercise = session.query(Exercise).filter_by(exercise_db_id=exercise_id).first()
    if exercise is None or not exercise.is_active:
        return None, 'Ejercicio no encontrado', 404
    if not can_manage_custom_exercise(user, exercise):
        return None, 'No tienes permisos para esta acción', 403
    return exercise, '', 200


def _get_user(session, user_id: int) -> User | None:
    return session.query(User).filter_by(id=user_id).first()


def _get_routine(session, routine_id: int) -> Routine | None:
    return session.query(Routine).filter_by(id=routine_id).first()


def can_manage_routine(routine_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        user = get_verified_user(session=session)
        if user is None:
            return False
        role = _role_value(user.role)
        routine = _get_routine(session, routine_id)
        if routine is None:
            return False
        if role == RoleEnum.ADMIN.value:
            return True
        if role == RoleEnum.TRAINER.value:
            return routine.trainer_id == user.id
        return False
    finally:
        if close_session:
            session.close()


def _athlete_has_routine_access(session, athlete_id: int, routine_id: int) -> bool:
    assignment = (
        session.query(UserRoutineAssignment)
        .filter_by(user_id=athlete_id, routine_id=routine_id, is_active=True)
        .first()
    )
    if assignment is not None:
        return True

    plan = (
        session.query(WeeklyPlan)
        .filter_by(user_id=athlete_id, is_active=True)
        .order_by(WeeklyPlan.created_at.desc())
        .first()
    )
    if plan is None:
        return False

    days = json.loads(plan.days or '[]')
    routine_id_str = str(routine_id)
    for day in days:
        day_routine_id = day.get('routineId')
        if day_routine_id is not None and str(day_routine_id) == routine_id_str:
            return True
    return False


def can_read_routine(routine_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        if can_manage_routine(routine_id, session=session):
            return True
        user = get_verified_user(session=session)
        if user is None:
            return False
        role = _role_value(user.role)
        if role == RoleEnum.USER.value:
            return _athlete_has_routine_access(session, user.id, routine_id)
        return False
    finally:
        if close_session:
            session.close()


def require_routine_read(routine_id: int, session=None):
    routine = _get_routine(session, routine_id) if session is not None else None
    if session is not None and routine is None:
        return {'error': 'Rutina no encontrada'}, 404
    if not can_read_routine(routine_id, session=session):
        if session is not None and routine is None:
            return {'error': 'Rutina no encontrada'}, 404
        return {'error': 'No tienes permisos para acceder a esta rutina'}, 403
    return None


def require_routine_manage(routine_id: int, session=None):
    routine = _get_routine(session, routine_id) if session is not None else None
    if session is not None and routine is None:
        return {'error': 'Rutina no encontrada'}, 404
    if not can_manage_routine(routine_id, session=session):
        if session is not None and routine is None:
            return {'error': 'Rutina no encontrada'}, 404
        return {'error': 'No tienes permisos para gestionar esta rutina'}, 403
    return None


def can_access_athlete(athlete_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        user = get_verified_user(session=session)
        if user is None:
            return False
        role = _role_value(user.role)
        if role == RoleEnum.ADMIN.value:
            return True
        if role == RoleEnum.USER.value and user.id == athlete_id:
            return True
        if role == RoleEnum.TRAINER.value:
            athlete = _get_user(session, athlete_id)
            return athlete is not None and athlete.trainer_id == user.id
        return False
    finally:
        if close_session:
            session.close()


def require_athlete_access(athlete_id: int, session=None):
    if not can_access_athlete(athlete_id, session=session):
        return {'error': 'No tienes permisos para acceder a este atleta'}, 403
    return None


def can_modify_athlete_diary(athlete_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        user = get_verified_user(session=session)
        if user is None:
            return False
        role = _role_value(user.role)
        if role == RoleEnum.ADMIN.value:
            return True
        if role == RoleEnum.USER.value and user.id == athlete_id:
            return True
        return False
    finally:
        if close_session:
            session.close()


def require_modify_athlete_diary(athlete_id: int, session=None):
    if not can_modify_athlete_diary(athlete_id, session=session):
        return {'error': 'No tienes permisos para modificar este diario'}, 403
    return None


def can_manage_athlete(athlete_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        user = get_verified_user(session=session)
        if user is None:
            return False
        role = _role_value(user.role)
        if role == RoleEnum.ADMIN.value:
            return True
        if role == RoleEnum.TRAINER.value:
            athlete = _get_user(session, athlete_id)
            return athlete is not None and athlete.trainer_id == user.id
        return False
    finally:
        if close_session:
            session.close()


def require_manage_athlete(athlete_id: int, session=None):
    athlete = _get_user(session, athlete_id) if session is not None else None
    if session is not None and athlete is None:
        return {'error': 'Atleta no encontrado'}, 404
    if not can_manage_athlete(athlete_id, session=session):
        if session is not None and athlete is None:
            return {'error': 'Atleta no encontrado'}, 404
        return {'error': 'No tienes permisos para gestionar este atleta'}, 403
    return None


def require_assignment_manage(assignment: UserRoutineAssignment, session=None):
    if assignment is None:
        return {'error': 'Asignación no encontrada'}, 404
    denied = require_manage_athlete(assignment.user_id, session=session)
    if denied:
        return denied
    user = get_verified_user(session=session)
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    role = _role_value(user.role)
    if role == RoleEnum.TRAINER.value and assignment.trainer_id != user.id:
        return {'error': 'No tienes permisos para gestionar esta asignación'}, 403
    return None


def can_edit_trainer_profile(trainer_id: int, session=None) -> bool:
    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True
    try:
        user = get_verified_user(session=session)
        if user is None:
            return False
        role = _role_value(user.role)
        if role == RoleEnum.ADMIN.value:
            return True
        return role == RoleEnum.TRAINER.value and user.id == trainer_id
    finally:
        if close_session:
            session.close()


def require_trainer_profile_access(trainer_id: int, session=None):
    if not can_edit_trainer_profile(trainer_id, session=session):
        return {'error': 'No tienes permisos para editar este perfil'}, 403
    return None


def has_active_membership(user_id: int, session=None) -> bool:
    from app.services.membership_service import MembershipService

    return MembershipService.has_active_membership(user_id, session=session)


def require_active_membership(user_id: int | None = None, session=None):
    user = get_verified_user(session=session)
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    role = _role_value(user.role)
    if role != RoleEnum.USER.value:
        return None
    target_id = user_id if user_id is not None else user.id
    if not has_active_membership(target_id, session=session):
        return {'error': 'Membresía activa requerida', 'code': 'membership_required'}, 403
    return None
