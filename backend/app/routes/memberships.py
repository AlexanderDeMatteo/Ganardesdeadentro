from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.models import RoleEnum
from app.services.membership_service import MembershipService
from app.utils.authorization import get_verified_user, require_athlete_access, role_required

memberships_bp = Blueprint('memberships', __name__)

_PLAN_CLIENT_ERRORS = frozenset({
    'name requerido',
    'Ya existe un plan con ese nombre',
    'El nombre no puede superar 120 caracteres',
    'functionalTier inválido; use basic, premium o pro',
})


def _plan_error_status(error: str) -> int:
    if error == 'Plan no encontrado':
        return 404
    if error in _PLAN_CLIENT_ERRORS:
        return 400
    return 500


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
    plan, error = MembershipService.create_plan(data)
    if error:
        return {'error': error}, _plan_error_status(error)
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
        return {'error': error}, _plan_error_status(error)
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


@memberships_bp.route('/subscribe', methods=['POST'])
@jwt_required()
def subscribe():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    if user.role != RoleEnum.USER:
        return {'error': 'Solo los atletas pueden suscribirse a un plan'}, 403

    data = request.get_json() or {}
    plan_id = data.get('planId')
    if plan_id is None:
        return {'error': 'planId requerido'}, 400
    plan_parsed, err = _parse_int(plan_id, 'planId')
    if err:
        return err

    membership, error = MembershipService.assign_membership(user.id, plan_parsed)
    if error:
        status = 404 if error in ('Atleta no encontrado', 'Plan no encontrado') else 500
        return {'error': error}, status
    return {'membership': membership}, 200


@memberships_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def assign_user_membership(user_id):
    parsed, err = _parse_int(user_id, 'userId')
    if err:
        return err
    data = request.get_json() or {}
    plan_id = data.get('planId')
    if plan_id is None:
        return {'error': 'planId requerido'}, 400
    plan_parsed, err = _parse_int(plan_id, 'planId')
    if err:
        return err
    membership, error = MembershipService.assign_membership(parsed, plan_parsed)
    if error:
        status = 404 if error in ('Atleta no encontrado', 'Plan no encontrado') else 500
        return {'error': error}, status
    return {'membership': membership}, 200
