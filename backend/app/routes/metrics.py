from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.services.metrics_service import MetricsService
from app.utils.authorization import require_athlete_access

metrics_bp = Blueprint('metrics', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


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
        metrics, error = MetricsService.list_metrics(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
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
        metric, error = MetricsService.add_metric(athlete_parsed, data, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
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
        metric, error = MetricsService.update_metric(parsed, request.get_json() or {}, session=session)
    finally:
        session.close()
    if error:
        status = 404 if error == 'Métrica no encontrada' else 500
        return {'error': error}, status
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
        success, error = MetricsService.delete_metric(parsed, session=session)
    finally:
        session.close()
    if not success:
        status = 404 if error == 'Métrica no encontrada' else 500
        return {'error': error}, status
    return {'message': 'Métrica eliminada'}, 200
