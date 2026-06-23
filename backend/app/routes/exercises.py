import logging
import mimetypes

from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.models import Exercise
from app.schemas.request_schemas import (
    CreateCustomExerciseSchema,
    UpdateCustomExerciseSchema,
    parse_schema,
)
from app.services.custom_exercise_service import CustomExerciseService
from app.services.exercise_api_service import GENERIC_ERROR, ExerciseAPIService
from app.utils.authorization import (
    _get_custom_exercise_or_forbidden,
    _role_value,
    get_current_user_id,
    get_verified_user,
    role_required,
)

logger = logging.getLogger(__name__)

exercises_bp = Blueprint('exercises', __name__)


def _staff_roles_only():
    user = get_verified_user()
    if user is None:
        return None, {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    if _role_value(user.role) not in ('admin', 'trainer'):
        return None, {'error': 'No tienes permisos para esta acción'}, 403
    return user, None, None


@exercises_bp.route('/muscles', methods=['GET'])
def get_all_muscles():
    source = request.args.get('source', 'api', type=str).lower()
    if source == 'catalog':
        muscles = ExerciseAPIService.get_catalog_muscles()
        return {'muscles': muscles, 'count': len(muscles), 'source': 'catalog'}, 200
    if source != 'api':
        return {'error': 'source debe ser api o catalog'}, 400

    muscles, error = ExerciseAPIService.get_all_muscles()
    if error:
        return {'error': error}, 500
    return {'muscles': muscles, 'count': len(muscles), 'source': 'api'}, 200


@exercises_bp.route('/by-muscle/<muscle>', methods=['GET'])
def get_exercises_by_muscle(muscle):
    limit = request.args.get('limit', 50, type=int)
    if limit > 100:
        limit = 100
    exercises, error = ExerciseAPIService.get_exercises_by_muscle(muscle, limit=limit)
    if error:
        return {'error': error}, 500
    return {'muscle': muscle, 'exercises': exercises, 'count': len(exercises)}, 200


@exercises_bp.route('/search', methods=['GET'])
@jwt_required()
def search_exercises():
    query = request.args.get('q', '', type=str).strip()
    limit = request.args.get('limit', 20, type=int)
    if not query or len(query) < 2:
        return {'error': 'Query debe tener al menos 2 caracteres'}, 400
    if limit > 100:
        limit = 100
    exercises, error = ExerciseAPIService.search_exercises(query, limit=limit)
    if error:
        return {'error': error}, 500
    return {'query': query, 'exercises': exercises, 'count': len(exercises)}, 200


@exercises_bp.route('/cached', methods=['GET'])
@jwt_required()
def get_cached_exercises():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401

    muscle = request.args.get('muscle', None, type=str)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    custom_only = request.args.get('custom_only', 'false', type=str).lower() == 'true'
    source = request.args.get('source', 'all', type=str).lower()
    custom_scope = request.args.get('custom_scope', None, type=str)
    q = request.args.get('q', None, type=str)
    if source not in ('all', 'catalog', 'custom'):
        return {'error': 'source debe ser all, catalog o custom'}, 400
    if custom_scope is not None and custom_scope.lower() not in ('mine', 'platform', 'all'):
        return {'error': 'custom_scope debe ser mine, platform o all'}, 400
    if per_page > 100:
        per_page = 100
    payload = CustomExerciseService.list_exercises(
        muscle=muscle,
        page=page,
        per_page=per_page,
        custom_only=custom_only,
        source=source,
        custom_scope=custom_scope.lower() if custom_scope else None,
        q=q,
        requester_id=user.id,
        requester_role=_role_value(user.role),
    )
    return payload, 200


@exercises_bp.route('/sync-catalog', methods=['POST'])
@jwt_required()
@role_required('admin')
def sync_exercise_catalog():
    limit_per_muscle = request.args.get('limit_per_muscle', 100, type=int)
    if limit_per_muscle > 100:
        limit_per_muscle = 100
    payload, error, status = ExerciseAPIService.sync_catalog(limit_per_muscle=limit_per_muscle)
    if error:
        return {'error': error}, status
    return payload, status


@exercises_bp.route('/clear-cache', methods=['POST'])
@jwt_required()
@role_required('admin')
def clear_exercise_cache():
    session = SessionLocal()
    try:
        deleted = session.query(Exercise).filter_by(is_cached=True).delete()
        session.commit()
        return {'message': f'{deleted} ejercicios eliminados del caché'}, 200
    except Exception:
        session.rollback()
        logger.exception('Error clearing exercise cache')
        return {'error': GENERIC_ERROR}, 500
    finally:
        session.close()


@exercises_bp.route('/media/<filename>', methods=['GET'])
def serve_exercise_media(filename):
    media_path = CustomExerciseService.get_media_path(filename)
    if media_path is None:
        return {'error': 'Archivo no encontrado'}, 404
    mime_type, _ = mimetypes.guess_type(str(media_path))
    return send_file(media_path, mimetype=mime_type or 'application/octet-stream')


@exercises_bp.route('', methods=['POST'])
@jwt_required()
@role_required('admin', 'trainer')
def create_custom_exercise():
    payload, error = parse_schema(CreateCustomExerciseSchema, request.get_json(silent=True) or {})
    if error:
        return {'error': error}, 400
    exercise, service_error, status = CustomExerciseService.create_exercise(
        get_current_user_id(),
        payload.model_dump(),
    )
    if service_error:
        return {'error': service_error}, status
    return {'exercise': exercise}, status


@exercises_bp.route('/<exercise_id>/match-animation', methods=['POST'])
@jwt_required()
def match_exercise_animation(exercise_id):
    user, err_body, err_status = _staff_roles_only()
    if user is None:
        return err_body, err_status

    session = SessionLocal()
    try:
        _, forbidden_error, forbidden_status = _get_custom_exercise_or_forbidden(
            session, exercise_id, user
        )
        if forbidden_error:
            return {'error': forbidden_error}, forbidden_status
    finally:
        session.close()

    exercise, error, status = CustomExerciseService.match_animation(exercise_id)
    if error:
        return {'error': error}, status
    return {'exercise': exercise}, status


@exercises_bp.route('/<exercise_id>/media', methods=['POST'])
@jwt_required()
def upload_exercise_media(exercise_id):
    user, err_body, err_status = _staff_roles_only()
    if user is None:
        return err_body, err_status

    session = SessionLocal()
    try:
        _, forbidden_error, forbidden_status = _get_custom_exercise_or_forbidden(
            session, exercise_id, user
        )
        if forbidden_error:
            return {'error': forbidden_error}, forbidden_status
    finally:
        session.close()

    file = request.files.get('file')
    exercise, error, status = CustomExerciseService.upload_media(exercise_id, file)
    if error:
        return {'error': error}, status
    return {'exercise': exercise}, status


@exercises_bp.route('/<exercise_id>', methods=['GET'])
def get_exercise(exercise_id):
    exercise, error, status = CustomExerciseService.get_exercise_record(exercise_id)
    if exercise is not None:
        return {'exercise': exercise}, 200
    if status == 404:
        return {'error': error or 'Ejercicio no encontrado'}, 404

    exercise_data, api_error = ExerciseAPIService.get_exercise_by_id(exercise_id)
    if api_error:
        status_code = 404 if api_error == 'Ejercicio no encontrado' else 500
        return {'error': api_error}, status_code
    return {'exercise': exercise_data}, 200


@exercises_bp.route('/<exercise_id>', methods=['PATCH'])
@jwt_required()
def update_custom_exercise(exercise_id):
    user, err_body, err_status = _staff_roles_only()
    if user is None:
        return err_body, err_status

    session = SessionLocal()
    try:
        _, forbidden_error, forbidden_status = _get_custom_exercise_or_forbidden(
            session, exercise_id, user
        )
        if forbidden_error:
            return {'error': forbidden_error}, forbidden_status
    finally:
        session.close()

    payload, error = parse_schema(UpdateCustomExerciseSchema, request.get_json(silent=True) or {})
    if error:
        return {'error': error}, 400
    patch = payload.model_dump(exclude_unset=True)
    if not patch:
        return {'error': 'No hay campos para actualizar'}, 400
    exercise, service_error, status = CustomExerciseService.update_exercise(exercise_id, patch)
    if service_error:
        return {'error': service_error}, status
    return {'exercise': exercise}, status


@exercises_bp.route('/<exercise_id>', methods=['DELETE'])
@jwt_required()
def delete_custom_exercise(exercise_id):
    user, err_body, err_status = _staff_roles_only()
    if user is None:
        return err_body, err_status

    session = SessionLocal()
    try:
        _, forbidden_error, forbidden_status = _get_custom_exercise_or_forbidden(
            session, exercise_id, user
        )
        if forbidden_error:
            return {'error': forbidden_error}, forbidden_status
    finally:
        session.close()

    result, error, status = CustomExerciseService.delete_exercise(exercise_id)
    if error:
        return {'error': error}, status
    return result or {'message': 'Ejercicio eliminado'}, status
