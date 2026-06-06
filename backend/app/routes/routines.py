from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.models import UserRoutineAssignment
from app.schemas.request_schemas import WeeklyPlanSchema, parse_schema
from app.services.routine_service import GENERIC_ERROR, RoutineService
from app.utils.authorization import (
    get_current_user_id,
    get_current_role,
    require_athlete_access,
    require_assignment_manage,
    require_manage_athlete,
    require_routine_manage,
    require_routine_read,
    role_required,
)

routines_bp = Blueprint('routines', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


def _parse_active_only() -> bool:
    value = request.args.get('activeOnly', 'true')
    return str(value).lower() not in ('false', '0', 'no')


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


@routines_bp.route('/assignments', methods=['GET'])
@jwt_required()
@role_required('trainer', 'admin')
def list_assignments():
    role = get_current_role()
    trainer_id = request.args.get('trainerId', type=int)
    if role == 'trainer':
        trainer_id = get_current_user_id()
    elif not trainer_id:
        return {'error': 'trainerId requerido'}, 400

    athlete_id = request.args.get('athleteId', type=int)
    active_only = _parse_active_only()
    session = SessionLocal()
    try:
        if athlete_id is not None:
            denied = require_manage_athlete(athlete_id, session=session)
            if denied:
                return denied
        assignments, error = RoutineService.list_assignments(
            trainer_id=trainer_id,
            athlete_id=athlete_id,
            active_only=active_only,
            session=session,
        )
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'assignments': assignments}, 200


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
        denied = require_routine_manage(routine_parsed, session=session)
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
    session = SessionLocal()
    try:
        assignment = session.query(UserRoutineAssignment).filter_by(id=parsed).first()
        denied = require_assignment_manage(assignment, session=session)
        if denied:
            return denied
        success, error = RoutineService.unassign_routine(parsed, session=session)
    finally:
        session.close()
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
    parsed, validation_error = parse_schema(WeeklyPlanSchema, data)
    if validation_error:
        return {'error': validation_error}, 400
    athlete_parsed = parsed.athleteId
    session = SessionLocal()
    try:
        denied = require_manage_athlete(athlete_parsed, session=session)
        if denied:
            return denied
        for day in parsed.days:
            if day.routineId is None:
                continue
            routine_parsed, err = _parse_int(day.routineId, 'routineId')
            if err:
                return err
            denied = require_routine_manage(routine_parsed, session=session)
            if denied:
                return denied
        days_payload = [day.model_dump() for day in parsed.days]
        plan, error = RoutineService.assign_weekly_plan(
            athlete_parsed,
            get_current_user_id(),
            days_payload,
            parsed.weekStartDate,
            session=session,
        )
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'weeklyPlan': plan}, 200


@routines_bp.route('/', methods=['GET'])
@jwt_required()
@role_required('trainer', 'admin')
def list_routines():
    role = get_current_role()
    trainer_id = request.args.get('trainerId', type=int)
    if role == 'trainer':
        trainer_id = get_current_user_id()
    elif not trainer_id:
        return {'error': 'trainerId requerido'}, 400

    active_only = _parse_active_only()
    routines, error = RoutineService.list_routines_by_trainer(trainer_id, active_only=active_only)
    if error:
        return {'error': error}, 500
    return {'routines': routines}, 200


@routines_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('trainer', 'admin')
def create_routine():
    data = request.get_json() or {}
    routine, error = RoutineService.create_routine(data, get_current_user_id(), get_current_role())
    if error:
        status = 500 if error == GENERIC_ERROR else 400
        return {'error': error}, status
    return {'routine': routine}, 201


@routines_bp.route('/<routine_id>', methods=['GET'])
@jwt_required()
def get_routine(routine_id):
    parsed, err = _parse_int(routine_id, 'routineId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_routine_read(parsed, session=session)
        if denied:
            return denied
        routine, error = RoutineService.get_routine_by_id(parsed, session=session)
    finally:
        session.close()
    if error:
        status = 404 if error == 'Rutina no encontrada' else 500
        return {'error': error}, status
    return {'routine': routine}, 200


@routines_bp.route('/<routine_id>', methods=['PATCH'])
@jwt_required()
@role_required('trainer', 'admin')
def update_routine(routine_id):
    parsed, err = _parse_int(routine_id, 'routineId')
    if err:
        return err
    data = request.get_json() or {}
    session = SessionLocal()
    try:
        denied = require_routine_manage(parsed, session=session)
        if denied:
            return denied
        routine, error = RoutineService.update_routine(parsed, data, session=session)
    finally:
        session.close()
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
    session = SessionLocal()
    try:
        denied = require_routine_manage(parsed, session=session)
        if denied:
            return denied
        success, error = RoutineService.delete_routine(parsed, session=session)
    finally:
        session.close()
    if not success:
        status = 404 if error == 'Rutina no encontrada' else 500
        return {'error': error}, status
    return {'message': 'Rutina eliminada'}, 200
