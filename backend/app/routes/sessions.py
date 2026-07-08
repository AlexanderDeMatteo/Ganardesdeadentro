from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required
from flask_limiter.util import get_remote_address
from flask_jwt_extended import get_jwt_identity
import mimetypes

from app.database import SessionLocal
from app.extensions import limiter
from app.services.session_execution_media_service import SessionExecutionMediaService
from app.services.session_service import GENERIC_ERROR, SessionService
from app.utils.authorization import get_current_user_id, require_athlete_access, require_active_membership

sessions_bp = Blueprint('sessions', __name__)


def _upload_rate_limit() -> str:
    from flask import current_app

    return str(current_app.config.get('UPLOAD_RATE_LIMIT', '10 per minute'))


def _jwt_user_or_ip_key() -> str:
    identity = get_jwt_identity()
    if identity:
        return f'user:{identity}'
    return f'ip:{get_remote_address()}'


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@sessions_bp.route('/complete', methods=['POST'])
@jwt_required()
def complete_session():
    data = request.get_json() or {}
    athlete_id = data.get('athleteId') or get_current_user_id()
    athlete_parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    if 'routineId' not in data:
        return {'error': 'routineId requerido'}, 400
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_parsed, session=session)
        if denied:
            return denied
        denied = require_active_membership(athlete_parsed, session=session)
        if denied:
            return denied
        log, error = SessionService.mark_complete(athlete_parsed, data, session=session)
    finally:
        session.close()
    if error:
        status = 400 if error != GENERIC_ERROR else 500
        if error in ('Rutina no encontrada', 'Rutina no asignada al atleta'):
            status = 400
        return {'error': error}, status
    return {'session': log}, 201


@sessions_bp.route('/', methods=['GET'])
@jwt_required()
def list_sessions():
    athlete_id = request.args.get('athleteId', type=int)
    if not athlete_id:
        return {'error': 'athleteId requerido'}, 400
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_id, session=session)
        if denied:
            return denied
        denied = require_active_membership(athlete_id, session=session)
        if denied:
            return denied
        logs, error = SessionService.list_sessions(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'sessions': logs}, 200


@sessions_bp.route('/week', methods=['GET'])
@jwt_required()
def week_sessions():
    athlete_id = request.args.get('athleteId', type=int)
    week_start = request.args.get('weekStart')
    if not athlete_id or not week_start:
        return {'error': 'athleteId y weekStart requeridos'}, 400
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_id, session=session)
        if denied:
            return denied
        denied = require_active_membership(athlete_id, session=session)
        if denied:
            return denied
        logs, error = SessionService.list_sessions_for_week(athlete_id, week_start, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'sessions': logs}, 200


@sessions_bp.route('/progress', methods=['GET'])
@jwt_required()
def exercise_progress():
    athlete_id = request.args.get('athleteId', type=int)
    exercise_id = request.args.get('exerciseId')
    if not athlete_id or not exercise_id:
        return {'error': 'athleteId y exerciseId requeridos'}, 400
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_id, session=session)
        if denied:
            return denied
        denied = require_active_membership(athlete_id, session=session)
        if denied:
            return denied
        points, error = SessionService.get_exercise_progress(athlete_id, exercise_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'progress': points}, 200


@sessions_bp.route('/execution-media', methods=['POST'])
@jwt_required()
@limiter.limit(_upload_rate_limit, key_func=_jwt_user_or_ip_key)
def upload_execution_media():
    athlete_id = request.form.get('athleteId') or get_current_user_id()
    athlete_parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_parsed, session=session)
        if denied:
            return denied
        denied = require_active_membership(athlete_parsed, session=session)
        if denied:
            return denied
        payload, error, status = SessionExecutionMediaService.upload(
            request.files.get('file'),
            athlete_id=athlete_parsed,
            uploaded_by_id=get_current_user_id(),
        )
    finally:
        session.close()
    if error:
        return {'error': error}, status
    return payload, status


@sessions_bp.route('/execution-media/<filename>', methods=['GET'])
@jwt_required()
def get_execution_media(filename):
    path = SessionExecutionMediaService.resolve_media_path(filename)
    if path is None:
        return {'error': 'Archivo no encontrado'}, 404
    owner_athlete_id = SessionExecutionMediaService.get_media_owner_athlete_id(filename)
    if owner_athlete_id is None:
        return {'error': 'Archivo no encontrado'}, 404
    denied = require_athlete_access(owner_athlete_id)
    if denied:
        return denied
    mime_type, _ = mimetypes.guess_type(str(path))
    return send_file(path, mimetype=mime_type or 'application/octet-stream', conditional=True)
