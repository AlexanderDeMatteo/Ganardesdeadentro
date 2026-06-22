from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.models import RoleEnum
from app.services.payment_service import PaymentService
from app.utils.authorization import get_verified_user, role_required

payments_bp = Blueprint('payments', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@payments_bp.route('/methods', methods=['GET'])
def list_payment_methods():
    methods, error = PaymentService.list_active_methods()
    if error:
        return {'error': error}, 500
    return {'methods': methods}, 200


@payments_bp.route('/methods/all', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_all_payment_methods():
    methods, error = PaymentService.list_all_methods()
    if error:
        return {'error': error}, 500
    return {'methods': methods}, 200


@payments_bp.route('/methods/<method_id>/instructions', methods=['GET'])
@jwt_required()
def get_payment_method_instructions(method_id):
    parsed, err = _parse_int(method_id, 'methodId')
    if err:
        return err
    method, error = PaymentService.get_method_instructions(parsed)
    if error:
        status = 404 if error == 'Método de pago no encontrado' else 500
        return {'error': error}, status
    return {'method': method}, 200


@payments_bp.route('/methods', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_payment_method():
    data = request.get_json() or {}
    method, error = PaymentService.create_method(data)
    if error:
        status = 400 if error in (
            'name requerido',
            'methodType inválido',
            'exchangeRateId inválido',
            'Tasa de cambio no encontrada',
        ) else 500
        return {'error': error}, status
    return {'method': method}, 201


@payments_bp.route('/methods/<method_id>', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def update_payment_method(method_id):
    parsed, err = _parse_int(method_id, 'methodId')
    if err:
        return err
    method, error = PaymentService.update_method(parsed, request.get_json() or {})
    if error:
        status = 404 if error == 'Método de pago no encontrado' else 400 if error in (
            'name requerido',
            'methodType inválido',
            'exchangeRateId inválido',
            'Tasa de cambio no encontrada',
        ) else 500
        return {'error': error}, status
    return {'method': method}, 200


@payments_bp.route('/methods/<method_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_payment_method(method_id):
    parsed, err = _parse_int(method_id, 'methodId')
    if err:
        return err
    success, error = PaymentService.delete_method(parsed)
    if not success:
        status = 404 if error == 'Método de pago no encontrado' else 500
        return {'error': error}, status
    return {'message': 'Método de pago eliminado'}, 200
