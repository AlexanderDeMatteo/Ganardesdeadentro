from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.schemas.request_schemas import BodyProfilePatchSchema, UpdateMeProfileSchema, parse_schema
from app.services.user_service import UserService
from app.utils.authorization import (
    get_current_user_id,
    get_current_role,
    require_athlete_access,
    require_manage_athlete,
    require_trainer_profile_access,
    role_required,
)

users_bp = Blueprint('users', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@users_bp.route('/trainer-athletes', methods=['GET'])
@jwt_required()
@role_required('trainer', 'admin')
def trainer_athletes():
    trainer_id = request.args.get('trainerId', type=int)
    if get_current_role() == 'trainer':
        trainer_id = get_current_user_id()
    if not trainer_id:
        return {'error': 'trainerId requerido'}, 400
    athletes, error = UserService.get_trainer_athletes(trainer_id)
    if error:
        return {'error': error}, 500
    return {'athletes': athletes}, 200


@users_bp.route('/athletes/<athlete_id>', methods=['GET'])
@jwt_required()
def get_athlete(athlete_id):
    parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_athlete_access(parsed, session=session)
        if denied:
            return denied
        athlete, error = UserService.get_athlete_by_id(parsed, session=session)
    finally:
        session.close()
    if error:
        status = 404 if error == 'Atleta no encontrado' else 500
        return {'error': error}, status
    return {'athlete': athlete}, 200


@users_bp.route('/athletes/<athlete_id>', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def patch_athlete(athlete_id):
    parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    data = request.get_json() or {}
    athlete, error = UserService.update_athlete(parsed, data)
    if error:
        if error in ('Atleta no encontrado',):
            status = 404
        elif error in ('Email inválido', 'El email ya está registrado', 'Plan de membresía no encontrado'):
            status = 400
        else:
            status = 500
        return {'error': error}, status
    return {'athlete': athlete}, 200


@users_bp.route('/athletes/<athlete_id>/trainer', methods=['PUT'])
@jwt_required()
@role_required('admin')
def assign_trainer(athlete_id):
    parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    data = request.get_json() or {}
    if 'trainerId' not in data:
        return {'error': 'trainerId requerido'}, 400
    trainer_id = data.get('trainerId')
    if trainer_id is None:
        trainer_parsed = None
    else:
        trainer_parsed, err = _parse_int(trainer_id, 'trainerId')
        if err:
            return err
    success, error = UserService.assign_trainer_to_athlete(parsed, trainer_parsed)
    if not success:
        status = 404 if 'no encontrado' in error.lower() else 500
        return {'error': error}, status
    return {'message': 'Entrenador asignado' if trainer_parsed else 'Entrenador desasignado'}, 200


@users_bp.route('/trainers/<trainer_id>', methods=['GET'])
@jwt_required()
def get_trainer(trainer_id):
    parsed, err = _parse_int(trainer_id, 'trainerId')
    if err:
        return err
    trainer, error = UserService.get_trainer_by_id(parsed)
    if error:
        status = 404 if error == 'Entrenador no encontrado' else 500
        return {'error': error}, status
    return {'trainer': trainer}, 200


@users_bp.route('/me', methods=['PATCH'])
@jwt_required()
def patch_me():
    user_id = get_current_user_id()
    data = request.get_json() or {}
    parsed, validation_error = parse_schema(UpdateMeProfileSchema, data)
    if validation_error:
        return {'error': validation_error}, 400
    if parsed.first_name is None and parsed.last_name is None:
        return {'error': 'Se requiere al menos un campo'}, 400
    patch = parsed.model_dump(exclude_none=True)
    user, error = UserService.update_me_profile(user_id, patch)
    if error:
        status = 401 if error == 'La cuenta ha sido desactivada' else 404 if error == 'Usuario no encontrado' else 400
        return {'error': error}, status
    return {'user': user}, 200


@users_bp.route('/trainers/<trainer_id>', methods=['PATCH'])
@jwt_required()
def patch_trainer(trainer_id):
    parsed, err = _parse_int(trainer_id, 'trainerId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_trainer_profile_access(parsed, session=session)
        if denied:
            return denied
    finally:
        session.close()
    data = request.get_json() or {}
    success, error = UserService.update_trainer_profile(parsed, data)
    if not success:
        status = 404 if error == 'Entrenador no encontrado' else 500
        return {'error': error}, status
    return {'message': 'Perfil actualizado'}, 200


@users_bp.route('/me/body-profile', methods=['GET'])
@jwt_required()
@role_required('user')
def get_my_body_profile():
    user_id = get_current_user_id()
    body_profile, error = UserService.get_body_profile(user_id)
    if error:
        status = 404 if error == 'Atleta no encontrado' else 500
        return {'error': error}, status
    return {'bodyProfile': body_profile}, 200


@users_bp.route('/me/body-profile', methods=['PATCH'])
@jwt_required()
@role_required('user')
def patch_my_body_profile():
    user_id = get_current_user_id()
    data = request.get_json() or {}
    parsed, validation_error = parse_schema(BodyProfilePatchSchema, data)
    if validation_error:
        return {'error': validation_error}, 400
    if not any(
        getattr(parsed, field) is not None
        for field in ('heightCm', 'age', 'sex')
    ):
        return {'error': 'Se requiere al menos un campo'}, 400
    patch = parsed.model_dump(exclude_none=True)
    body_profile, error = UserService.update_body_profile(user_id, patch)
    if error:
        status = 404 if error == 'Atleta no encontrado' else 500
        return {'error': error}, status
    return {'bodyProfile': body_profile}, 200


@users_bp.route('/athletes/<athlete_id>/body-profile', methods=['GET'])
@jwt_required()
def get_athlete_body_profile(athlete_id):
    parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    session = SessionLocal()
    try:
        denied = require_athlete_access(parsed, session=session)
        if denied:
            return denied
        body_profile, error = UserService.get_body_profile(parsed, session=session)
    finally:
        session.close()
    if error:
        status = 404 if error == 'Atleta no encontrado' else 500
        return {'error': error}, status
    return {'bodyProfile': body_profile}, 200


@users_bp.route('/my-trainer', methods=['GET'])
@jwt_required()
def my_trainer():
    athlete_id = request.args.get('athleteId', type=int) or get_current_user_id()
    session = SessionLocal()
    try:
        denied = require_athlete_access(athlete_id, session=session)
        if denied:
            return denied
        trainer, error = UserService.get_my_trainer(athlete_id, session=session)
    finally:
        session.close()
    if error:
        return {'error': error}, 500
    return {'trainer': trainer}, 200
