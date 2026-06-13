import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models import InvitationToken, RoleEnum, User, UserProfile
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.utils.validation import validate_email

logger = logging.getLogger(__name__)

GENERIC_INVITE_ERROR = 'Enlace inválido o expirado'
GENERIC_ERROR = 'No se pudo completar la operación'
TRAINER_INVITE_PURPOSE = 'trainer_invite'


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()


def _invite_expiry_hours() -> int:
    return int(os.getenv('INVITATION_EXPIRY_HOURS', '72'))


class InvitationService:
    @staticmethod
    def _invalidate_pending_tokens(user_id: int, purpose: str, session) -> None:
        now = datetime.now(timezone.utc)
        session.query(InvitationToken).filter(
            InvitationToken.user_id == user_id,
            InvitationToken.purpose == purpose,
            InvitationToken.used_at.is_(None),
        ).update({'used_at': now})

    @staticmethod
    def _create_token_for_user(user_id: int, purpose: str, session) -> str:
        InvitationService._invalidate_pending_tokens(user_id, purpose, session)
        raw_token = secrets.token_urlsafe(32)
        token = InvitationToken(
            user_id=user_id,
            token_hash=_hash_token(raw_token),
            purpose=purpose,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=_invite_expiry_hours()),
        )
        session.add(token)
        session.flush()
        return raw_token

    @staticmethod
    def create_trainer_invitation(
        email: str,
        first_name: str,
        last_name: str,
        specialization: str | None = None,
        session=None,
    ) -> tuple[dict | None, str, str | None]:
        """Returns (trainer_payload, error, raw_token_for_email)."""
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            email_error = validate_email(email)
            if email_error:
                return None, email_error, None

            normalized_email = email.strip().lower()
            existing = session.query(User).filter_by(email=normalized_email).first()
            if existing:
                return None, 'El email ya está registrado', None

            if not first_name.strip() or not last_name.strip():
                return None, 'Nombre y apellido son requeridos', None

            placeholder_password = secrets.token_urlsafe(32)
            user = User(
                email=normalized_email,
                password_hash=AuthService.hash_password(placeholder_password),
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                role=RoleEnum.TRAINER,
                is_active=False,
            )
            session.add(user)
            session.flush()

            profile = UserProfile(
                user_id=user.id,
                specialization=(specialization or 'General').strip()[:160],
                created_at=datetime.now(timezone.utc),
            )
            session.add(profile)

            raw_token = InvitationService._create_token_for_user(
                user.id,
                TRAINER_INVITE_PURPOSE,
                session,
            )
            session.commit()

            from app.schemas.serializers import serialize_trainer

            return serialize_trainer(user, profile, athlete_count=0), '', raw_token

        except Exception:
            session.rollback()
            logger.exception('Error creating trainer invitation')
            return None, GENERIC_ERROR, None
        finally:
            if close_session:
                session.close()

    @staticmethod
    def validate_token(raw_token: str, session=None) -> tuple[dict | None, str]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            if not raw_token or not isinstance(raw_token, str):
                return None, GENERIC_INVITE_ERROR

            token_hash = _hash_token(raw_token.strip())
            record = (
                session.query(InvitationToken)
                .filter_by(token_hash=token_hash, purpose=TRAINER_INVITE_PURPOSE)
                .first()
            )
            if not record or record.used_at is not None:
                return None, GENERIC_INVITE_ERROR

            now = datetime.now(timezone.utc)
            expires_at = record.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if now >= expires_at:
                return None, GENERIC_INVITE_ERROR

            user = session.query(User).filter_by(id=record.user_id).first()
            if not user or user.role != RoleEnum.TRAINER or user.is_active:
                return None, GENERIC_INVITE_ERROR

            return {
                'email': user.email,
                'firstName': user.first_name,
                'expiresAt': expires_at.isoformat(),
            }, ''
        except Exception:
            logger.exception('Error validating invitation token')
            return None, GENERIC_INVITE_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def accept_invitation(raw_token: str, password: str, session=None) -> tuple[bool, str]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            if not password or len(password) < 8:
                return False, 'La contraseña debe tener al menos 8 caracteres'

            if not raw_token or not isinstance(raw_token, str):
                return False, GENERIC_INVITE_ERROR

            token_hash = _hash_token(raw_token.strip())
            record = (
                session.query(InvitationToken)
                .filter_by(token_hash=token_hash, purpose=TRAINER_INVITE_PURPOSE)
                .with_for_update()
                .first()
            )
            if not record or record.used_at is not None:
                return False, GENERIC_INVITE_ERROR

            now = datetime.now(timezone.utc)
            expires_at = record.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if now >= expires_at:
                return False, GENERIC_INVITE_ERROR

            user = session.query(User).filter_by(id=record.user_id).first()
            if not user or user.role != RoleEnum.TRAINER or user.is_active:
                return False, GENERIC_INVITE_ERROR

            user.password_hash = AuthService.hash_password(password)
            user.is_active = True
            user.updated_at = now
            record.used_at = now
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error accepting invitation')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def resend_trainer_invitation(trainer_id: int, session=None) -> tuple[str | None, str]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            user = session.query(User).filter_by(id=trainer_id, role=RoleEnum.TRAINER).first()
            if not user:
                return None, 'Entrenador no encontrado'
            if user.is_active:
                return None, 'El entrenador ya activó su cuenta'

            raw_token = InvitationService._create_token_for_user(
                user.id,
                TRAINER_INVITE_PURPOSE,
                session,
            )
            session.commit()
            return raw_token, ''
        except Exception:
            session.rollback()
            logger.exception('Error resending trainer invitation')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
