from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.services.membership_service import MembershipService
from app.utils.authorization import require_athlete_access, role_required

memberships_bp = Blueprint('memberships', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@memberships_bp.route('/active', methods=['GET'])
@jwt_required()
def active_membership():
    athlete_id = request.args.get('athleteId', type=int)
    if not athlete_id:
        return {'error': 'athleteId requerido'}, 400
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_id, session=session)
        if denied:
            return denied
        membership, error = MembershipService.get_active_membership(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'membership': membership}, 200


@memberships_bp.route('/plans', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_plans():
    plans, error = MembershipService.list_plans()
    if error:
        return {'error': error}, 500
    return {'plans': plans}, 200


@memberships_bp.route('/plans', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_plan():
    data = request.get_json() or {}
    if not data.get('name'):
        return {'error': 'name requerido'}, 400
    plan, error = MembershipService.create_plan(data)
    if error:
        return {'error': error}, 500
    return {'plan': plan}, 201


@memberships_bp.route('/plans/<plan_id>', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def update_plan(plan_id):
    parsed, err = _parse_int(plan_id, 'planId')
    if err:
        return err
    plan, error = MembershipService.update_plan(parsed, request.get_json() or {})
    if error:
        status = 404 if error == 'Plan no encontrado' else 500
        return {'error': error}, status
    return {'plan': plan}, 200


@memberships_bp.route('/plans/<plan_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_plan(plan_id):
    parsed, err = _parse_int(plan_id, 'planId')
    if err:
        return err
    success, error = MembershipService.delete_plan(parsed)
    if not success:
        status = 404 if error == 'Plan no encontrado' else 500
        return {'error': error}, status
    return {'message': 'Plan eliminado'}, 200
