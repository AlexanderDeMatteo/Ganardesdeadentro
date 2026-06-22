import logging
import os
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from sqlalchemy.orm import joinedload

from app.config import get_config
from app.database import SessionLocal
from app.models import (
    ExchangeRate,
    Membership,
    MembershipPaymentRequest,
    PaymentMethod,
    User,
    UserProfile,
)
from app.schemas.serializers import serialize_payment_method, serialize_payment_request
from app.services.membership_service import MembershipService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'

config = get_config()

RECEIPT_MIME_TO_EXT = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
}


class PaymentService:
    VALID_METHOD_TYPES = frozenset({'digital', 'bank', 'crypto', 'cash'})

    @staticmethod
    def _ensure_upload_dir() -> Path:
        upload_dir = Path(config.PAYMENT_RECEIPT_UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir

    @staticmethod
    def _allowed_mimes() -> set[str]:
        return {m.strip() for m in config.PAYMENT_RECEIPT_ALLOWED_MIME.split(',') if m.strip()}

    @staticmethod
    def _slugify(name: str) -> str:
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower().strip())
        return slug.strip('-') or 'method'

    @staticmethod
    def _normalize_method_type(value: str | None) -> str:
        normalized = (value or 'digital').strip().lower()
        if normalized not in PaymentService.VALID_METHOD_TYPES:
            return ''
        return normalized

    @staticmethod
    def _normalize_details(value) -> list[dict[str, str]]:
        raw = value
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                return []
        if not isinstance(raw, list):
            return []
        details: list[dict[str, str]] = []
        for item in raw[:10]:
            if not isinstance(item, dict):
                continue
            key = str(item.get('key') or item.get('name') or '').strip()
            val = str(item.get('value') or '').strip()
            if not key and not val:
                continue
            details.append({'key': key, 'value': val})
        return details

    @staticmethod
    def _resolve_exchange_rate(session, exchange_rate_id) -> tuple[ExchangeRate | None, str]:
        if exchange_rate_id in (None, '', 'null'):
            return None, ''
        try:
            parsed = int(exchange_rate_id)
        except (TypeError, ValueError):
            return None, 'exchangeRateId inválido'
        rate = session.query(ExchangeRate).filter_by(id=parsed, is_active=True).first()
        if not rate:
            return None, 'Tasa de cambio no encontrada'
        return rate, ''

    @staticmethod
    def compute_converted_amount(amount_usd: float, rate_value: float) -> float:
        return round(float(amount_usd) * float(rate_value), 2)

    @staticmethod
    def _unique_slug(session, base_slug: str, exclude_id: int | None = None) -> str:
        slug = base_slug
        counter = 1
        while True:
            query = session.query(PaymentMethod).filter_by(slug=slug)
            if exclude_id is not None:
                query = query.filter(PaymentMethod.id != exclude_id)
            if query.first() is None:
                return slug
            counter += 1
            slug = f'{base_slug}-{counter}'

    @classmethod
    def save_receipt(cls, file: FileStorage) -> tuple[str | None, str, str, int, str]:
        if file is None or not file.filename:
            return None, '', '', 0, 'Comprobante requerido'

        mime = (file.mimetype or '').lower()
        allowed = cls._allowed_mimes()
        if mime not in allowed:
            return None, '', '', 0, 'Formato de archivo no permitido'

        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > config.PAYMENT_RECEIPT_MAX_BYTES:
            return None, '', '', 0, 'El archivo supera el tamaño máximo permitido'

        ext = RECEIPT_MIME_TO_EXT.get(mime, 'bin')
        filename = f'{uuid.uuid4().hex}.{ext}'
        upload_dir = cls._ensure_upload_dir()
        dest = upload_dir / filename
        file.save(dest)
        return str(dest), mime, filename, size, ''

    @staticmethod
    def list_active_methods(session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            methods = (
                session.query(PaymentMethod)
                .options(joinedload(PaymentMethod.exchange_rate))
                .filter_by(is_active=True)
                .order_by(PaymentMethod.sort_order.asc(), PaymentMethod.id.asc())
                .all()
            )
            return [serialize_payment_method(m) for m in methods], ''
        except Exception:
            logger.exception('Error listing payment methods')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_all_methods(session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            methods = (
                session.query(PaymentMethod)
                .options(joinedload(PaymentMethod.exchange_rate))
                .order_by(PaymentMethod.sort_order.asc(), PaymentMethod.id.asc())
                .all()
            )
            return [serialize_payment_method(m, include_instructions=True) for m in methods], ''
        except Exception:
            logger.exception('Error listing all payment methods')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_method_instructions(method_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            method = (
                session.query(PaymentMethod)
                .options(joinedload(PaymentMethod.exchange_rate))
                .filter_by(id=method_id, is_active=True)
                .first()
            )
            if not method:
                return None, 'Método de pago no encontrado'
            return serialize_payment_method(method, include_instructions=True), ''
        except Exception:
            logger.exception('Error getting payment method instructions')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def create_method(data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            name = (data.get('name') or '').strip()
            if not name:
                return None, 'name requerido'
            base_slug = PaymentService._slugify(data.get('slug') or name)
            slug = PaymentService._unique_slug(session, base_slug)
            method_type = PaymentService._normalize_method_type(data.get('methodType'))
            if not method_type:
                return None, 'methodType inválido'
            method = PaymentMethod(
                name=name,
                slug=slug,
                category=(data.get('category') or '').strip(),
                method_type=method_type,
                details=json.dumps(PaymentService._normalize_details(data.get('details'))),
                instructions=(data.get('instructions') or '').strip(),
                sort_order=int(data.get('sortOrder') or 0),
                is_active=bool(data.get('isActive', True)),
            )
            exchange_rate, rate_error = PaymentService._resolve_exchange_rate(
                session,
                data.get('exchangeRateId'),
            )
            if rate_error:
                return None, rate_error
            method.exchange_rate_id = exchange_rate.id if exchange_rate else None
            session.add(method)
            session.commit()
            session.refresh(method)
            return serialize_payment_method(method, include_instructions=True), ''
        except Exception:
            session.rollback()
            logger.exception('Error creating payment method')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_method(method_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            method = session.query(PaymentMethod).filter_by(id=method_id).first()
            if not method:
                return None, 'Método de pago no encontrado'
            if 'name' in patch:
                name = (patch['name'] or '').strip()
                if not name:
                    return None, 'name requerido'
                method.name = name
            if 'slug' in patch and patch['slug']:
                base_slug = PaymentService._slugify(patch['slug'])
                method.slug = PaymentService._unique_slug(session, base_slug, exclude_id=method.id)
            if 'category' in patch:
                method.category = (patch['category'] or '').strip()
            if 'methodType' in patch:
                method_type = PaymentService._normalize_method_type(patch.get('methodType'))
                if not method_type:
                    return None, 'methodType inválido'
                method.method_type = method_type
            if 'details' in patch:
                method.details = json.dumps(PaymentService._normalize_details(patch.get('details')))
            if 'instructions' in patch:
                method.instructions = (patch['instructions'] or '').strip()
            if 'exchangeRateId' in patch:
                exchange_rate, rate_error = PaymentService._resolve_exchange_rate(
                    session,
                    patch.get('exchangeRateId'),
                )
                if rate_error:
                    return None, rate_error
                method.exchange_rate_id = exchange_rate.id if exchange_rate else None
            if 'sortOrder' in patch:
                method.sort_order = int(patch['sortOrder'] or 0)
            if 'isActive' in patch:
                method.is_active = bool(patch['isActive'])
            method.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(method)
            return serialize_payment_method(method, include_instructions=True), ''
        except Exception:
            session.rollback()
            logger.exception('Error updating payment method')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def delete_method(method_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            method = session.query(PaymentMethod).filter_by(id=method_id).first()
            if not method:
                return False, 'Método de pago no encontrado'
            method.is_active = False
            method.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error deleting payment method')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def _sync_user_profile(session, user_id: int, phone: str, country: str, seller_code: str | None):
        profile = session.query(UserProfile).filter_by(user_id=user_id).first()
        if profile is None:
            profile = UserProfile(user_id=user_id)
            session.add(profile)
        profile.phone = phone
        profile.country = country
        if seller_code:
            profile.seller_code = seller_code

    @classmethod
    def create_payment_request(
        cls,
        user_id: int,
        data: dict,
        receipt: FileStorage,
        session=None,
    ):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            pending = (
                session.query(MembershipPaymentRequest)
                .filter_by(user_id=user_id, status='pending')
                .first()
            )
            if pending:
                return None, 'Ya tienes una solicitud de pago pendiente'

            plan_id = data.get('planId')
            method_id = data.get('paymentMethodId')
            if plan_id is None or method_id is None:
                return None, 'planId y paymentMethodId requeridos'

            plan = session.query(Membership).filter_by(id=int(plan_id), is_active=True).first()
            if not plan:
                return None, 'Plan no encontrado'

            method = session.query(PaymentMethod).filter_by(id=int(method_id), is_active=True).first()
            if not method:
                return None, 'Método de pago no encontrado'

            full_name = (data.get('fullName') or '').strip()
            phone = (data.get('phone') or '').strip()
            country = (data.get('country') or '').strip()
            email = (data.get('email') or '').strip()
            if not full_name or not phone or not country or not email:
                return None, 'fullName, phone, country y email son requeridos'

            receipt_path, mime, _filename, size, upload_error = cls.save_receipt(receipt)
            if upload_error:
                return None, upload_error

            seller_code = (data.get('sellerCode') or '').strip() or None
            amount_usd = float(plan.price or 0)
            amount_converted = None
            converted_currency = None
            exchange_rate_snapshot = None
            if method.exchange_rate is not None:
                exchange_rate_snapshot = float(method.exchange_rate.rate)
                converted_currency = method.exchange_rate.to_currency
                amount_converted = PaymentService.compute_converted_amount(
                    amount_usd,
                    exchange_rate_snapshot,
                )
            if data.get('amountUsd') not in (None, ''):
                try:
                    amount_usd = round(float(data.get('amountUsd')), 2)
                except (TypeError, ValueError):
                    return None, 'amountUsd inválido'
            if data.get('amountConverted') not in (None, ''):
                try:
                    amount_converted = round(float(data.get('amountConverted')), 2)
                except (TypeError, ValueError):
                    return None, 'amountConverted inválido'
            if data.get('convertedCurrency') not in (None, ''):
                converted_currency = str(data.get('convertedCurrency')).strip().upper()[:3]
            if data.get('exchangeRateSnapshot') not in (None, ''):
                try:
                    exchange_rate_snapshot = float(data.get('exchangeRateSnapshot'))
                except (TypeError, ValueError):
                    return None, 'exchangeRateSnapshot inválido'
            req = MembershipPaymentRequest(
                user_id=user_id,
                membership_id=plan.id,
                payment_method_id=method.id,
                full_name=full_name,
                phone=phone,
                country=country,
                seller_code=seller_code,
                email=email,
                amount=amount_converted if amount_converted is not None else amount_usd,
                amount_usd=amount_usd,
                amount_converted=amount_converted,
                converted_currency=converted_currency,
                exchange_rate_snapshot=exchange_rate_snapshot,
                receipt_path=receipt_path or '',
                receipt_mime=mime,
                receipt_size=size,
                status='pending',
            )
            session.add(req)
            cls._sync_user_profile(session, user_id, phone, country, seller_code)
            session.commit()
            session.refresh(req)
            serialized = serialize_payment_request(req, include_receipt_url=True)
            user = session.query(User).filter_by(id=user_id).first()
            athlete_name = f'{user.first_name} {user.last_name}'.strip() if user else 'Atleta'
            NotificationService.notify_admins(
                'payment.submitted',
                'Nueva solicitud de pago',
                f'{athlete_name} solicitó el plan {plan.name}',
                {
                    'requestId': str(req.id),
                    'userId': str(user_id),
                    'planId': str(plan.id),
                    'planName': plan.name,
                },
                session=session,
            )
            return serialized, ''
        except Exception:
            session.rollback()
            logger.exception('Error creating payment request')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_my_requests(user_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            requests = (
                session.query(MembershipPaymentRequest)
                .options(
                    joinedload(MembershipPaymentRequest.user),
                    joinedload(MembershipPaymentRequest.membership),
                    joinedload(MembershipPaymentRequest.payment_method).joinedload(PaymentMethod.exchange_rate),
                )
                .filter_by(user_id=user_id)
                .order_by(MembershipPaymentRequest.created_at.desc())
                .all()
            )
            return [serialize_payment_request(r, include_receipt_url=True) for r in requests], ''
        except Exception:
            logger.exception('Error listing user payment requests')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_requests(status: str | None = None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            query = (
                session.query(MembershipPaymentRequest)
                .options(
                    joinedload(MembershipPaymentRequest.user),
                    joinedload(MembershipPaymentRequest.membership),
                    joinedload(MembershipPaymentRequest.payment_method).joinedload(PaymentMethod.exchange_rate),
                )
            )
            if status:
                query = query.filter_by(status=status)
            requests = query.order_by(MembershipPaymentRequest.created_at.desc()).all()
            return [serialize_payment_request(r, include_receipt_url=True) for r in requests], ''
        except Exception:
            logger.exception('Error listing payment requests')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_request(request_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            req = (
                session.query(MembershipPaymentRequest)
                .options(
                    joinedload(MembershipPaymentRequest.user),
                    joinedload(MembershipPaymentRequest.membership),
                    joinedload(MembershipPaymentRequest.payment_method).joinedload(PaymentMethod.exchange_rate),
                )
                .filter_by(id=request_id)
                .first()
            )
            if not req:
                return None, 'Solicitud no encontrada'
            return serialize_payment_request(req, include_receipt_url=True), ''
        except Exception:
            logger.exception('Error getting payment request')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_receipt_path(request_id: int, session=None) -> tuple[str | None, str, str, str]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            req = (
                session.query(MembershipPaymentRequest)
                .options(
                    joinedload(MembershipPaymentRequest.user),
                    joinedload(MembershipPaymentRequest.membership),
                    joinedload(MembershipPaymentRequest.payment_method).joinedload(PaymentMethod.exchange_rate),
                )
                .filter_by(id=request_id)
                .first()
            )
            if not req:
                return None, '', '', 'Solicitud no encontrada'
            if not req.receipt_path or not Path(req.receipt_path).exists():
                return None, '', '', 'Comprobante no encontrado'
            return req.receipt_path, req.receipt_mime, Path(req.receipt_path).name, ''
        except Exception:
            logger.exception('Error getting receipt path')
            return None, '', '', GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def approve_request(request_id: int, admin_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            req = (
                session.query(MembershipPaymentRequest)
                .options(
                    joinedload(MembershipPaymentRequest.user),
                    joinedload(MembershipPaymentRequest.membership),
                    joinedload(MembershipPaymentRequest.payment_method).joinedload(PaymentMethod.exchange_rate),
                )
                .filter_by(id=request_id)
                .first()
            )
            if not req:
                return None, 'Solicitud no encontrada'
            if req.status != 'pending':
                return None, 'La solicitud ya fue procesada'

            membership, error = MembershipService.assign_membership_on_payment(
                req.user_id,
                req.membership_id,
                session=session,
            )
            if error:
                return None, error

            req.status = 'approved'
            req.reviewed_by = admin_id
            req.reviewed_at = datetime.now(timezone.utc)
            req.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(req)
            payload = serialize_payment_request(req, include_receipt_url=True)
            payload['membership'] = membership
            NotificationService.create(
                req.user_id,
                'payment.approved',
                'Membresía activada',
                f'Tu pago para {req.membership.name if req.membership else "tu plan"} fue aprobado.',
                {
                    'requestId': str(req.id),
                    'planId': str(req.membership_id),
                    'planName': req.membership.name if req.membership else '',
                },
                session=session,
            )
            return payload, ''
        except Exception:
            session.rollback()
            logger.exception('Error approving payment request')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def reject_request(request_id: int, admin_id: int, reason: str | None = None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            req = (
                session.query(MembershipPaymentRequest)
                .options(
                    joinedload(MembershipPaymentRequest.user),
                    joinedload(MembershipPaymentRequest.membership),
                    joinedload(MembershipPaymentRequest.payment_method).joinedload(PaymentMethod.exchange_rate),
                )
                .filter_by(id=request_id)
                .first()
            )
            if not req:
                return None, 'Solicitud no encontrada'
            if req.status != 'pending':
                return None, 'La solicitud ya fue procesada'

            req.status = 'rejected'
            req.reviewed_by = admin_id
            req.reviewed_at = datetime.now(timezone.utc)
            req.rejection_reason = (reason or '').strip() or None
            req.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(req)
            serialized = serialize_payment_request(req, include_receipt_url=True)
            NotificationService.create(
                req.user_id,
                'payment.rejected',
                'Pago rechazado',
                (reason or '').strip() or 'Tu solicitud de pago fue rechazada. Contacta a soporte si necesitas ayuda.',
                {
                    'requestId': str(req.id),
                    'planId': str(req.membership_id),
                    'reason': (reason or '').strip() or None,
                },
                session=session,
            )
            return serialized, ''
        except Exception:
            session.rollback()
            logger.exception('Error rejecting payment request')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
