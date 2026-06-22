from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.services.notification_service import NotificationService
from app.utils.authorization import get_verified_user

notifications_bp = Blueprint('notifications', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def list_notifications():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    limit = 50
    notifications, error = NotificationService.list_for_user(user.id, limit=limit)
    if error:
        return {'error': error}, 500
    return {'notifications': notifications}, 200


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    count, error = NotificationService.unread_count(user.id)
    if error:
        return {'error': error}, 500
    return {'count': count}, 200


@notifications_bp.route('/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_read(notification_id):
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    parsed, err = _parse_int(notification_id, 'notificationId')
    if err:
        return err
    notification, error = NotificationService.mark_read(parsed, user.id)
    if error:
        status = 404 if error == 'Notificación no encontrada' else 500
        return {'error': error}, status
    return {'notification': notification}, 200


@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    result, error = NotificationService.mark_all_read(user.id)
    if error:
        return {'error': error}, 500
    return result, 200
