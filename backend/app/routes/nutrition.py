from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.services.nutrition_service import GENERIC_ERROR, NutritionService
from app.utils.authorization import require_athlete_access, require_manage_athlete, role_required

nutrition_bp = Blueprint('nutrition', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@nutrition_bp.route('/plan', methods=['GET'])
@jwt_required()
def get_plan():
    athlete_id = request.args.get('athleteId', type=int)
    if not athlete_id:
        return {'error': 'athleteId requerido'}, 400
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_id, session=session)
        if denied:
            return denied
        plan, error = NutritionService.get_plan(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'plan': plan}, 200


@nutrition_bp.route('/plan', methods=['PUT'])
@jwt_required()
@role_required('trainer', 'admin')
def publish_plan():
    data = request.get_json() or {}
    athlete_id = data.get('athleteId')
    if athlete_id is None:
        return {'error': 'athleteId requerido'}, 400
    athlete_parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_manage_athlete(athlete_parsed, session=session)
        if denied:
            return denied
        plan, error = NutritionService.publish_plan(data, session=session)
    finally:
        session.close()
    if error:
        if error in ('Atleta no encontrado',):
            return {'error': error}, 404
        if error in ('El usuario no es un atleta',):
            return {'error': error}, 400
        status = 400 if error not in (GENERIC_ERROR,) else 500
        return {'error': error}, status
    return {'plan': plan}, 200


@nutrition_bp.route('/coach-draft', methods=['GET'])
@jwt_required()
@role_required('trainer', 'admin')
def get_coach_draft():
    athlete_id = request.args.get('athleteId', type=int)
    if not athlete_id:
        return {'error': 'athleteId requerido'}, 400
    session = SessionLocal()
    try:
        denied = require_manage_athlete(athlete_id, session=session)
        if denied:
            return denied
        draft, error = NutritionService.get_coach_draft(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'draft': draft}, 200


@nutrition_bp.route('/coach-draft', methods=['PUT'])
@jwt_required()
@role_required('trainer', 'admin')
def save_coach_draft():
    data = request.get_json() or {}
    athlete_id = data.get('athleteId')
    draft = data.get('draft')
    if athlete_id is None or draft is None:
        return {'error': 'athleteId y draft requeridos'}, 400
    athlete_parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_manage_athlete(athlete_parsed, session=session)
        if denied:
            return denied
        saved, error = NutritionService.save_coach_draft(athlete_parsed, draft, session=session)
    finally:
        session.close()
    if error:
        status = 400 if error != GENERIC_ERROR else 500
        return {'error': error}, status
    return {'draft': saved}, 200
