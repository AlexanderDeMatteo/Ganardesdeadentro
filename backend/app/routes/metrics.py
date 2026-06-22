from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.models import RoleEnum, User
from app.services.metrics_service import VALIDATION_ERRORS, MetricsService
from app.utils.authorization import require_athlete_access, require_active_membership

metrics_bp = Blueprint('metrics', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


def _error_status(error: str) -> int:
    if error in VALIDATION_ERRORS:
        return 400
    if error == 'Métrica no encontrada':
        return 404
    return 500


@metrics_bp.route('/', methods=['GET'])
@jwt_required()
def list_metrics():
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
        metrics, error = MetricsService.list_metrics(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, _error_status(error)
    return {'metrics': metrics}, 200


@metrics_bp.route('/', methods=['POST'])
@jwt_required()
def create_metric():
    data = request.get_json() or {}
    athlete_id = data.get('athleteId')
    if athlete_id is None:
        return {'error': 'athleteId requerido'}, 400
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
        athlete = session.query(User).filter_by(id=athlete_parsed).first()
        if not athlete:
            return {'error': 'Atleta no encontrado'}, 404
        if athlete.role != RoleEnum.USER.value:
            return {'error': 'El usuario no es un atleta'}, 400
        metric, error = MetricsService.add_metric(athlete_parsed, data, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, _error_status(error)
    return {'metric': metric}, 201


@metrics_bp.route('/<metric_id>', methods=['PATCH'])
@jwt_required()
def update_metric(metric_id):
    parsed, err = _parse_int(metric_id, 'metricId')
    if err:
        return err
    session = SessionLocal()
    try:
        existing = MetricsService.get_metric(parsed, session=session)
        if not existing:
            return {'error': 'Métrica no encontrada'}, 404
        denied = require_athlete_access(existing.user_id, session=session)
        if denied:
            return denied
        denied = require_active_membership(existing.user_id, session=session)
        if denied:
            return denied
        metric, error = MetricsService.update_metric(parsed, request.get_json() or {}, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, _error_status(error)
    return {'metric': metric}, 200


@metrics_bp.route('/<metric_id>', methods=['DELETE'])
@jwt_required()
def delete_metric(metric_id):
    parsed, err = _parse_int(metric_id, 'metricId')
    if err:
        return err
    session = SessionLocal()
    try:
        existing = MetricsService.get_metric(parsed, session=session)
        if not existing:
            return {'error': 'Métrica no encontrada'}, 404
        denied = require_athlete_access(existing.user_id, session=session)
        if denied:
            return denied
        denied = require_active_membership(existing.user_id, session=session)
        if denied:
            return denied
        success, error = MetricsService.delete_metric(parsed, session=session)
    finally:
        session.close()
    if not success:
        return {'error': error}, _error_status(error)
    return {'message': 'Métrica eliminada'}, 200
