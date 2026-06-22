import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import ExchangeRate

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


def _serialize_exchange_rate(rate: ExchangeRate) -> dict:
    return {
        'id': str(rate.id),
        'fromCurrency': rate.from_currency,
        'toCurrency': rate.to_currency,
        'rate': rate.rate,
        'label': rate.label or '',
        'isActive': bool(rate.is_active),
        'createdAt': rate.created_at.isoformat() if rate.created_at else None,
        'updatedAt': rate.updated_at.isoformat() if rate.updated_at else None,
    }


class ExchangeRateService:
    @staticmethod
    def _normalize_currency(value: str | None, default: str) -> str:
        cleaned = (value or default).strip().upper()
        return cleaned[:3]

    @staticmethod
    def list_rates(active: bool | None = None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            query = session.query(ExchangeRate)
            if active is not None:
                query = query.filter_by(is_active=active)
            rates = query.order_by(ExchangeRate.updated_at.desc(), ExchangeRate.id.desc()).all()
            return [_serialize_exchange_rate(rate) for rate in rates], ''
        except Exception:
            logger.exception('Error listing exchange rates')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def create_rate(data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            from_currency = ExchangeRateService._normalize_currency(data.get('fromCurrency'), 'USD')
            to_currency = ExchangeRateService._normalize_currency(data.get('toCurrency'), 'VES')
            rate_value = float(data.get('rate') or 0)
            if rate_value <= 0:
                return None, 'rate debe ser mayor que 0'
            label = (data.get('label') or f'{from_currency} → {to_currency}').strip()
            existing = (
                session.query(ExchangeRate)
                .filter_by(from_currency=from_currency, to_currency=to_currency, is_active=True)
                .first()
            )
            if existing:
                return None, 'Ya existe una tasa activa para ese par de monedas'

            rate = ExchangeRate(
                from_currency=from_currency,
                to_currency=to_currency,
                rate=rate_value,
                label=label,
                is_active=bool(data.get('isActive', True)),
            )
            session.add(rate)
            session.commit()
            session.refresh(rate)
            return _serialize_exchange_rate(rate), ''
        except ValueError:
            return None, 'rate inválido'
        except Exception:
            session.rollback()
            logger.exception('Error creating exchange rate')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_rate(rate_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            rate = session.query(ExchangeRate).filter_by(id=rate_id).first()
            if not rate:
                return None, 'Tasa no encontrada'

            from_currency = ExchangeRateService._normalize_currency(
                patch.get('fromCurrency', rate.from_currency),
                rate.from_currency,
            )
            to_currency = ExchangeRateService._normalize_currency(
                patch.get('toCurrency', rate.to_currency),
                rate.to_currency,
            )
            if 'rate' in patch:
                rate_value = float(patch.get('rate') or 0)
                if rate_value <= 0:
                    return None, 'rate debe ser mayor que 0'
                rate.rate = rate_value
            if 'label' in patch:
                rate.label = (patch.get('label') or '').strip()
            if 'isActive' in patch:
                rate.is_active = bool(patch.get('isActive'))
            rate.from_currency = from_currency
            rate.to_currency = to_currency
            rate.updated_at = datetime.now(timezone.utc)

            duplicate = (
                session.query(ExchangeRate)
                .filter(
                    ExchangeRate.id != rate.id,
                    ExchangeRate.from_currency == from_currency,
                    ExchangeRate.to_currency == to_currency,
                    ExchangeRate.is_active.is_(True),
                )
                .first()
            )
            if duplicate and rate.is_active:
                return None, 'Ya existe una tasa activa para ese par de monedas'

            session.commit()
            session.refresh(rate)
            return _serialize_exchange_rate(rate), ''
        except ValueError:
            return None, 'rate inválido'
        except Exception:
            session.rollback()
            logger.exception('Error updating exchange rate')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def delete_rate(rate_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            rate = session.query(ExchangeRate).filter_by(id=rate_id).first()
            if not rate:
                return False, 'Tasa no encontrada'
            rate.is_active = False
            rate.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error deleting exchange rate')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
