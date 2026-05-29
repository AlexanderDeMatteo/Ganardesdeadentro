from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.services.routine_service import RoutineService
from app.utils.authorization import (
    get_current_user_id,
    get_current_role,
    require_athlete_access,
    require_manage_athlete,
    role_required,
)

routines_bp = Blueprint('routines', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@routines_bp.route('/my', methods=['GET'])
@jwt_required()
def my_routine():
    athlete_id = request.args.get('athleteId', type=int)
    if not athlete_id:
        return {'error': 'athleteId requerido'}, 400
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_id, session=session)
        if denied:
            return denied
        result, error = RoutineService.get_my_routine(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return result, 200


@routines_bp.route('/<routine_id>', methods=['GET'])
@jwt_required()
def get_routine(routine_id):
    parsed, err = _parse_int(routine_id, 'routineId')
    if err:
        return err
    routine, error = RoutineService.get_routine_by_id(parsed)
    if error:
        status = 404 if error == 'Rutina no encontrada' else 500
        return {'error': error}, status
    return {'routine': routine}, 200


@routines_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('trainer', 'admin')
def create_routine():
    data = request.get_json() or {}
    routine, error = RoutineService.create_routine(data, get_current_user_id(), get_current_role())
    if error:
        return {'error': error}, 500
    return {'routine': routine}, 201


@routines_bp.route('/<routine_id>', methods=['PATCH'])
@jwt_required()
@role_required('trainer', 'admin')
def update_routine(routine_id):
    parsed, err = _parse_int(routine_id, 'routineId')
    if err:
        return err
    data = request.get_json() or {}
    routine, error = RoutineService.update_routine(parsed, data)
    if error:
        status = 404 if error == 'Rutina no encontrada' else 500
        return {'error': error}, status
    return {'routine': routine}, 200


@routines_bp.route('/<routine_id>', methods=['DELETE'])
@jwt_required()
@role_required('trainer', 'admin')
def delete_routine(routine_id):
    parsed, err = _parse_int(routine_id, 'routineId')
    if err:
        return err
    success, error = RoutineService.delete_routine(parsed)
    if not success:
        status = 404 if error == 'Rutina no encontrada' else 500
        return {'error': error}, status
    return {'message': 'Rutina eliminada'}, 200


@routines_bp.route('/assignments', methods=['POST'])
@jwt_required()
@role_required('trainer', 'admin')
def assign_routine():
    data = request.get_json() or {}
    athlete_id = data.get('athleteId')
    routine_id = data.get('routineId')
    if athlete_id is None or routine_id is None:
        return {'error': 'athleteId y routineId requeridos'}, 400
    athlete_parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    routine_parsed, err = _parse_int(routine_id, 'routineId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_manage_athlete(athlete_parsed, session=session)
        if denied:
            return denied
        trainer_id = get_current_user_id() if get_current_role() == 'trainer' else data.get('trainerId', get_current_user_id())
        assignment, error = RoutineService.assign_routine(athlete_parsed, routine_parsed, int(trainer_id), session=session)
    finally:
        session.close()
    if error:
        status = 404 if error == 'Rutina no encontrada' else 500
        return {'error': error}, status
    return {'assignment': assignment}, 201


@routines_bp.route('/assignments/<assignment_id>', methods=['DELETE'])
@jwt_required()
@role_required('trainer', 'admin')
def unassign_routine(assignment_id):
    parsed, err = _parse_int(assignment_id, 'assignmentId')
    if err:
        return err
    success, error = RoutineService.unassign_routine(parsed)
    if not success:
        status = 404 if error == 'Asignación no encontrada' else 500
        return {'error': error}, status
    return {'message': 'Asignación eliminada'}, 200


@routines_bp.route('/weekly-plan', methods=['GET'])
@jwt_required()
def get_weekly_plan():
    athlete_id = request.args.get('athleteId', type=int)
    if not athlete_id:
        return {'error': 'athleteId requerido'}, 400
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_id, session=session)
        if denied:
            return denied
        plan, error = RoutineService.get_weekly_plan(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'weeklyPlan': plan}, 200


@routines_bp.route('/weekly-plan', methods=['PUT'])
@jwt_required()
@role_required('trainer', 'admin')
def assign_weekly_plan():
    data = request.get_json() or {}
    athlete_id = data.get('athleteId')
    days = data.get('days', [])
    week_start = data.get('weekStartDate')
    if athlete_id is None or not week_start:
        return {'error': 'athleteId y weekStartDate requeridos'}, 400
    athlete_parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_manage_athlete(athlete_parsed, session=session)
        if denied:
            return denied
        plan, error = RoutineService.assign_weekly_plan(
            athlete_parsed,
            get_current_user_id(),
            days,
            week_start,
            session=session,
        )
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'weeklyPlan': plan}, 200
