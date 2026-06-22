from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.services.session_service import GENERIC_ERROR, SessionService
from app.utils.authorization import get_current_user_id, require_athlete_access, require_active_membership

sessions_bp = Blueprint('sessions', __name__)


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
