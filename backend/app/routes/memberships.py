from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required

from app.database import SessionLocal
from app.models import MembershipPaymentRequest, RoleEnum
from app.services.membership_service import MembershipService
from app.services.payment_service import PaymentService
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


@memberships_bp.route('/plans/public', methods=['GET'])
def list_plans_public():
    plans, error = MembershipService.list_plans()
    if error:
        return {'error': error}, 500
    return {'plans': plans}, 200


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

    return {
        'error': 'La suscripción directa está deshabilitada. Envía una solicitud de pago con comprobante.',
        'code': 'payment_required',
    }, 403


@memberships_bp.route('/payment-requests', methods=['POST'])
@jwt_required()
def create_payment_request():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    if user.role != RoleEnum.USER:
        return {'error': 'Solo los atletas pueden enviar solicitudes de pago'}, 403

    form = request.form
    receipt = request.files.get('receipt')
    data = {
        'planId': form.get('planId'),
        'paymentMethodId': form.get('paymentMethodId'),
        'fullName': form.get('fullName'),
        'phone': form.get('phone'),
        'country': form.get('country'),
        'sellerCode': form.get('sellerCode'),
        'email': form.get('email'),
        'amountUsd': form.get('amountUsd'),
        'amountConverted': form.get('amountConverted'),
        'convertedCurrency': form.get('convertedCurrency'),
        'exchangeRateSnapshot': form.get('exchangeRateSnapshot'),
    }
    payment_request, error = PaymentService.create_payment_request(user.id, data, receipt)
    if error:
        status = 400 if error in (
            'planId y paymentMethodId requeridos',
            'fullName, phone, country y email son requeridos',
            'Comprobante requerido',
            'Formato de archivo no permitido',
            'El archivo supera el tamaño máximo permitido',
            'Ya tienes una solicitud de pago pendiente',
            'Plan no encontrado',
            'Método de pago no encontrado',
            'amountUsd inválido',
            'amountConverted inválido',
            'exchangeRateSnapshot inválido',
        ) else 500
        return {'error': error}, status
    return {'paymentRequest': payment_request}, 201


@memberships_bp.route('/payment-requests/mine', methods=['GET'])
@jwt_required()
def list_my_payment_requests():
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    requests, error = PaymentService.list_my_requests(user.id)
    if error:
        return {'error': error}, 500
    return {'paymentRequests': requests}, 200


@memberships_bp.route('/payment-requests', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_payment_requests():
    status = request.args.get('status')
    requests, error = PaymentService.list_requests(status=status)
    if error:
        return {'error': error}, 500
    return {'paymentRequests': requests}, 200


@memberships_bp.route('/payment-requests/<request_id>', methods=['GET'])
@jwt_required()
def get_payment_request(request_id):
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    parsed, err = _parse_int(request_id, 'requestId')
    if err:
        return err

    session = SessionLocal()
    try:
        req = session.query(MembershipPaymentRequest).filter_by(id=parsed).first()
        if not req:
            return {'error': 'Solicitud no encontrada'}, 404
        role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        if role != RoleEnum.ADMIN.value and req.user_id != user.id:
            return {'error': 'No tienes permisos para ver esta solicitud'}, 403
    finally:
        session.close()

    payment_request, error = PaymentService.get_request(parsed)
    if error:
        return {'error': error}, 404 if error == 'Solicitud no encontrada' else 500
    return {'paymentRequest': payment_request}, 200


@memberships_bp.route('/payment-requests/<request_id>/approve', methods=['POST'])
@jwt_required()
@role_required('admin')
def approve_payment_request(request_id):
    user = get_verified_user()
    parsed, err = _parse_int(request_id, 'requestId')
    if err:
        return err
    result, error = PaymentService.approve_request(parsed, user.id)
    if error:
        status = 404 if error == 'Solicitud no encontrada' else 400 if error == 'La solicitud ya fue procesada' else 500
        return {'error': error}, status
    return {'paymentRequest': result}, 200


@memberships_bp.route('/payment-requests/<request_id>/reject', methods=['POST'])
@jwt_required()
@role_required('admin')
def reject_payment_request(request_id):
    user = get_verified_user()
    parsed, err = _parse_int(request_id, 'requestId')
    if err:
        return err
    data = request.get_json() or {}
    result, error = PaymentService.reject_request(parsed, user.id, data.get('reason'))
    if error:
        status = 404 if error == 'Solicitud no encontrada' else 400 if error == 'La solicitud ya fue procesada' else 500
        return {'error': error}, status
    return {'paymentRequest': result}, 200


@memberships_bp.route('/payment-requests/<request_id>/receipt', methods=['GET'])
@jwt_required()
def serve_payment_receipt(request_id):
    user = get_verified_user()
    if user is None:
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401
    parsed, err = _parse_int(request_id, 'requestId')
    if err:
        return err

    session = SessionLocal()
    try:
        req = session.query(MembershipPaymentRequest).filter_by(id=parsed).first()
        if not req:
            return {'error': 'Solicitud no encontrada'}, 404
        role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        if role != RoleEnum.ADMIN.value and req.user_id != user.id:
            return {'error': 'No tienes permisos para ver este comprobante'}, 403
    finally:
        session.close()

    path, mime, filename, error = PaymentService.get_receipt_path(parsed)
    if error:
        status = 404 if error in ('Solicitud no encontrada', 'Comprobante no encontrado') else 500
        return {'error': error}, status
    return send_file(path, mimetype=mime, as_attachment=False, download_name=filename)


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
