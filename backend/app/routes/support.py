from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.services.support_service import SupportService
from app.utils.authorization import get_verified_user, require_athlete_access, role_required

support_bp = Blueprint('support', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@support_bp.route('/thread', methods=['GET'])
@jwt_required()
@role_required('user')
def get_my_thread():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    thread, messages, error = SupportService.get_thread_for_athlete(user.id)
    if error:
        return {'error': error}, 500
    return {'thread': thread, 'messages': messages}, 200


@support_bp.route('/messages', methods=['POST'])
@jwt_required()
@role_required('user')
def send_athlete_message():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    data = request.get_json() or {}
    body = data.get('body', '')
    message, error = SupportService.send_message(user.id, user, body)
    if error:
        status = 400 if error in (
            'El mensaje no puede estar vacío',
            'No tienes permisos para enviar mensajes en este hilo',
            'No tienes permisos para enviar mensajes de soporte',
        ) or 'no puede superar' in error else 500
        return {'error': error}, status
    return {'message': message}, 201


@support_bp.route('/thread/read', methods=['POST'])
@jwt_required()
@role_required('user')
def mark_my_thread_read():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    result, error = SupportService.mark_thread_read(user.id, 'user')
    if error:
        return {'error': error}, 500
    return result, 200


@support_bp.route('/threads', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_threads():
    threads, error = SupportService.list_threads_for_admin()
    if error:
        return {'error': error}, 500
    return {'threads': threads}, 200


@support_bp.route('/threads/<athlete_id>', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_thread(athlete_id):
    parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    denied = require_athlete_access(parsed)
    if denied:
        return denied
    thread, messages, error = SupportService.get_thread_for_admin(parsed)
    if error:
        status = 404 if error == 'Conversación no encontrada' else 500
        return {'error': error}, status
    return {'thread': thread, 'messages': messages}, 200


@support_bp.route('/threads/<athlete_id>/messages', methods=['POST'])
@jwt_required()
@role_required('admin')
def send_admin_message(athlete_id):
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    denied = require_athlete_access(parsed)
    if denied:
        return denied
    data = request.get_json() or {}
    body = data.get('body', '')
    message, error = SupportService.send_message(parsed, user, body)
    if error:
        status = 400 if error in (
            'El mensaje no puede estar vacío',
            'No tienes permisos para enviar mensajes en este hilo',
            'No tienes permisos para enviar mensajes de soporte',
        ) or 'no puede superar' in error else 500
        return {'error': error}, status
    return {'message': message}, 201


@support_bp.route('/threads/<athlete_id>/read', methods=['POST'])
@jwt_required()
@role_required('admin')
def mark_thread_read(athlete_id):
    parsed, err = _parse_int(athlete_id, 'athleteId')
    if err:
        return err
    denied = require_athlete_access(parsed)
    if denied:
        return denied
    result, error = SupportService.mark_thread_read(parsed, 'admin')
    if error:
        return {'error': error}, 500
    return result, 200
