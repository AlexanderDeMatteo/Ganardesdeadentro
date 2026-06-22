from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.services.exchange_rate_service import ExchangeRateService
from app.utils.authorization import role_required

exchange_rates_bp = Blueprint('exchange_rates', __name__)


def _parse_int(value, name='id'):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, ({'error': f'{name} inválido'}, 400)


@exchange_rates_bp.route('/', methods=['GET'])
@jwt_required()
@role_required('admin')
def list_exchange_rates():
    active_arg = request.args.get('active')
    active = None
    if active_arg is not None:
        active = str(active_arg).lower() in ('true', '1', 'yes')
    rates, error = ExchangeRateService.list_rates(active=active)
    if error:
        return {'error': error}, 500
    return {'exchangeRates': rates}, 200


@exchange_rates_bp.route('/public', methods=['GET'])
def list_exchange_rates_public():
    rates, error = ExchangeRateService.list_rates(active=True)
    if error:
        return {'error': error}, 500
    return {'exchangeRates': rates}, 200


@exchange_rates_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_exchange_rate():
    rate, error = ExchangeRateService.create_rate(request.get_json() or {})
    if error:
        status = 400 if error in (
            'rate inválido',
            'rate debe ser mayor que 0',
            'Ya existe una tasa activa para ese par de monedas',
        ) else 500
        return {'error': error}, status
    return {'exchangeRate': rate}, 201


@exchange_rates_bp.route('/<rate_id>', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def update_exchange_rate(rate_id):
    parsed, err = _parse_int(rate_id, 'rateId')
    if err:
        return err
    rate, error = ExchangeRateService.update_rate(parsed, request.get_json() or {})
    if error:
        status = 404 if error == 'Tasa no encontrada' else 400 if error in (
            'rate inválido',
            'rate debe ser mayor que 0',
            'Ya existe una tasa activa para ese par de monedas',
        ) else 500
        return {'error': error}, status
    return {'exchangeRate': rate}, 200


@exchange_rates_bp.route('/<rate_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_exchange_rate(rate_id):
    parsed, err = _parse_int(rate_id, 'rateId')
    if err:
        return err
    success, error = ExchangeRateService.delete_rate(parsed)
    if not success:
        status = 404 if error == 'Tasa no encontrada' else 500
        return {'error': error}, status
    return {'message': 'Tasa eliminada'}, 200
