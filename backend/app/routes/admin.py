from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.schemas.request_schemas import CreateTrainerInviteSchema, DeactivateTrainerSchema, ReactivateTrainerSchema, parse_schema
from app.services.admin_service import AdminService
from app.utils.authorization import role_required

admin_bp = Blueprint('admin', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@admin_bp.route('/overview', methods=['GET'])
@jwt_required()
@role_required('admin')
def overview():
    data, error = AdminService.get_overview()
    if error:
        return {'error': error}, 500
    return data, 200


@admin_bp.route('/athletes', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_athletes():
    athletes, error = AdminService.list_athletes()
    if error:
        return {'error': error}, 500
    return {'athletes': athletes}, 200


@admin_bp.route('/trainers', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_trainers():
    include_inactive = request.args.get('includeInactive', 'false').lower() == 'true'
    trainers, error = AdminService.list_trainers(include_inactive=include_inactive)
    if error:
        return {'error': error}, 500
    return {'trainers': trainers}, 200


@admin_bp.route('/trainers', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_trainer():
    data = request.get_json() or {}
    parsed, validation_error = parse_schema(CreateTrainerInviteSchema, data)
    if validation_error:
        return {'error': validation_error}, 400
    trainer, error = AdminService.create_trainer_invitation(
        email=parsed.email,
        first_name=parsed.firstName,
        last_name=parsed.lastName,
        specialization=parsed.specialization,
    )
    if error:
        status = 400 if error != 'No se pudo completar la operación' else 500
        return {'error': error}, status
    return {'trainer': trainer, 'message': 'Invitación enviada'}, 201


@admin_bp.route('/trainers/<trainer_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def deactivate_trainer(trainer_id):
    parsed_id, err = _parse_int(trainer_id, 'trainerId')
    if err:
        return err
    data = request.get_json() or {}
    parsed, validation_error = parse_schema(DeactivateTrainerSchema, data)
    if validation_error:
        return {'error': validation_error}, 400
    athlete_actions = [a.model_dump() for a in parsed.athleteActions]
    success, error = AdminService.deactivate_trainer(parsed_id, athlete_actions)
    if not success:
        if error in ('Entrenador no encontrado', 'El entrenador ya está inactivo'):
            status = 404
        elif error in (
            'Debe indicar una acción para cada atleta asignado',
            'newTrainerId requerido para reasignar',
            'Entrenador de destino no válido',
        ):
            status = 400
        else:
            status = 500
        return {'error': error}, status
    return {'message': 'Entrenador desactivado'}, 200


@admin_bp.route('/trainers/<trainer_id>', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def reactivate_trainer(trainer_id):
    parsed_id, err = _parse_int(trainer_id, 'trainerId')
    if err:
        return err
    data = request.get_json() or {}
    parsed, validation_error = parse_schema(ReactivateTrainerSchema, data)
    if validation_error:
        return {'error': validation_error}, 400
    if parsed.isActive is None and parsed.maxAthletes is None:
        return {'error': 'Se requiere al menos un campo'}, 400
    if parsed.isActive is True:
        success, error = AdminService.reactivate_trainer(parsed_id)
        if not success:
            if error in ('Entrenador no encontrado', 'El entrenador ya está activo'):
                status = 404 if error == 'Entrenador no encontrado' else 400
            else:
                status = 500
            return {'error': error}, status
    if parsed.maxAthletes is not None:
        success, error = AdminService.update_trainer_max_athletes(parsed_id, parsed.maxAthletes)
        if not success:
            status = 404 if error == 'Entrenador no encontrado' else 500
            return {'error': error}, status
    return {'message': 'Entrenador actualizado'}, 200


@admin_bp.route('/trainers/<trainer_id>/resend-invite', methods=['POST'])
@jwt_required()
@role_required('admin')
def resend_trainer_invite(trainer_id):
    parsed_id, err = _parse_int(trainer_id, 'trainerId')
    if err:
        return err
    success, error = AdminService.resend_trainer_invite(parsed_id)
    if not success:
        if error == 'Entrenador no encontrado':
            status = 404
        elif error == 'El entrenador ya activó su cuenta':
            status = 400
        else:
            status = 500
        return {'error': error}, status
    return {'message': 'Invitación reenviada'}, 200
