import logging

import bcrypt
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import RoleEnum, User, UserProfile
from app.utils.validation import validate_email

logger = logging.getLogger(__name__)

GENERIC_ERROR = 'No se pudo completar la operación'

ALLOWED_ROLES = {role.value for role in RoleEnum}


class AuthService:
    """Servicio de autenticación."""

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

    @staticmethod
    def create_user(
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        role: str = 'user',
        session=None,
    ) -> tuple[User | None, str]:
        if role not in ALLOWED_ROLES:
            return None, 'Rol no permitido'

        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            email_error = validate_email(email)
            if email_error:
                return None, email_error

            normalized_email = email.strip().lower()

            existing_user = session.query(User).filter_by(email=normalized_email).first()
            if existing_user:
                return None, 'El email ya está registrado'

            if not password or not first_name or not last_name:
                return None, 'Faltan campos requeridos'

            if len(password) < 8:
                return None, 'La contraseña debe tener al menos 8 caracteres'

            user = User(
                email=normalized_email,
                password_hash=AuthService.hash_password(password),
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                role=RoleEnum(role) if isinstance(role, str) else role,
                is_active=True,
            )

            session.add(user)
            session.flush()

            profile = UserProfile(
                user_id=user.id,
                created_at=datetime.now(timezone.utc),
            )
            session.add(profile)
            session.commit()

            return user, ''

        except Exception:
            session.rollback()
            logger.exception('Error al crear usuario')
            return None, GENERIC_ERROR

        finally:
            if close_session:
                session.close()

    @staticmethod
    def authenticate_user(
        email: str,
        password: str,
        session=None,
    ) -> tuple[User | None, str]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            email_error = validate_email(email)
            if email_error:
                return None, 'Email o contraseña incorrectos'

            user = session.query(User).filter_by(email=email.strip().lower()).first()

            if not user:
                return None, 'Email o contraseña incorrectos'

            if not user.is_active:
                return None, 'La cuenta ha sido desactivada'

            if not AuthService.verify_password(password, user.password_hash):
                return None, 'Email o contraseña incorrectos'

            return user, ''

        except Exception:
            logger.exception('Error al autenticar usuario')
            return None, GENERIC_ERROR

        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_user_by_id(user_id: int, session=None) -> User | None:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            return session.query(User).filter_by(id=user_id).first()
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_user_by_email(email: str, session=None) -> User | None:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            return session.query(User).filter_by(email=email.strip().lower()).first()
        finally:
            if close_session:
                session.close()

    @staticmethod
    def change_password(
        user_id: int,
        old_password: str,
        new_password: str,
        session=None,
    ) -> tuple[bool, str]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True

        try:
            user = session.query(User).filter_by(id=user_id).first()

            if not user:
                return False, 'Usuario no encontrado'

            if not user.is_active:
                return False, 'La cuenta ha sido desactivada'

            if not AuthService.verify_password(old_password, user.password_hash):
                return False, 'Contraseña actual incorrecta'

            if len(new_password) < 8:
                return False, 'La nueva contraseña debe tener al menos 8 caracteres'

            user.password_hash = AuthService.hash_password(new_password)
            user.updated_at = datetime.now(timezone.utc)
            session.commit()

            return True, ''

        except Exception:
            session.rollback()
            logger.exception('Error al cambiar contraseña')
            return False, GENERIC_ERROR

        finally:
            if close_session:
                session.close()
