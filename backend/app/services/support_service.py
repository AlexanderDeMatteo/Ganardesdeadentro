import logging
from datetime import datetime, timezone

from sqlalchemy.orm import joinedload

from app.database import SessionLocal
from app.models import RoleEnum, SupportMessage, SupportThread, User
from app.realtime.emit import emit_to_support_thread, emit_to_user
from app.schemas.serializers import serialize_support_message, serialize_support_thread
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'
MAX_BODY_LENGTH = 4000
PREVIEW_LENGTH = 180


def _role_value(role) -> str:
    return role.value if hasattr(role, 'value') else str(role)


def _preview(body: str) -> str:
    trimmed = (body or '').strip().replace('\n', ' ')
    if len(trimmed) <= PREVIEW_LENGTH:
        return trimmed
    return f'{trimmed[:PREVIEW_LENGTH - 1]}…'


class SupportService:
    @staticmethod
    def get_thread(athlete_id: int, session=None, *, include_athlete: bool = False) -> SupportThread | None:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            query = session.query(SupportThread).filter_by(athlete_id=athlete_id)
            if include_athlete:
                query = query.options(joinedload(SupportThread.athlete))
            return query.first()
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_or_create_thread(athlete_id: int, session=None) -> tuple[SupportThread | None, str]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            thread = session.query(SupportThread).filter_by(athlete_id=athlete_id).first()
            if thread is None:
                thread = SupportThread(athlete_id=athlete_id)
                session.add(thread)
                session.commit()
                session.refresh(thread)
            return thread, ''
        except Exception:
            session.rollback()
            logger.exception('Error getting support thread')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_messages(athlete_id: int, before_id: int | None = None, limit: int = 50, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            query = session.query(SupportMessage).filter_by(athlete_id=athlete_id)
            if before_id is not None:
                query = query.filter(SupportMessage.id < before_id)
            rows = (
                query.order_by(SupportMessage.created_at.desc())
                .limit(max(1, min(limit, 100)))
                .all()
            )
            rows.reverse()
            return [serialize_support_message(r) for r in rows], ''
        except Exception:
            logger.exception('Error listing support messages')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def send_message(athlete_id: int, sender: User, body: str, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            text = (body or '').strip()
            if not text:
                return None, 'El mensaje no puede estar vacío'
            if len(text) > MAX_BODY_LENGTH:
                return None, f'El mensaje no puede superar {MAX_BODY_LENGTH} caracteres'

            sender_role = _role_value(sender.role)
            if sender_role == RoleEnum.USER.value and sender.id != athlete_id:
                return None, 'No tienes permisos para enviar mensajes en este hilo'
            if sender_role not in (RoleEnum.USER.value, RoleEnum.ADMIN.value):
                return None, 'No tienes permisos para enviar mensajes de soporte'

            thread, thread_error = SupportService.get_or_create_thread(athlete_id, session=session)
            if thread_error:
                return None, thread_error

            now = datetime.now(timezone.utc)
            message = SupportMessage(
                athlete_id=athlete_id,
                sender_id=sender.id,
                sender_role=sender_role,
                body=text,
                created_at=now,
            )
            session.add(message)

            thread.last_message_at = now
            thread.last_message_preview = _preview(text)
            if sender_role == RoleEnum.USER.value:
                thread.unread_for_admin = (thread.unread_for_admin or 0) + 1
            else:
                thread.unread_for_athlete = (thread.unread_for_athlete or 0) + 1

            session.commit()
            session.refresh(message)

            serialized = serialize_support_message(message)
            emit_to_support_thread(athlete_id, 'support:message', serialized)

            athlete = session.query(User).filter_by(id=athlete_id).first()
            athlete_name = f'{athlete.first_name} {athlete.last_name}'.strip() if athlete else 'Atleta'

            if sender_role == RoleEnum.USER.value:
                NotificationService.notify_admins(
                    'support.message',
                    'Nuevo mensaje de soporte',
                    f'{athlete_name}: {_preview(text)}',
                    {'athleteId': str(athlete_id), 'messageId': str(message.id)},
                    session=session,
                )
            else:
                NotificationService.create(
                    athlete_id,
                    'support.reply',
                    'Respuesta de soporte',
                    _preview(text),
                    {'athleteId': str(athlete_id), 'messageId': str(message.id)},
                    session=session,
                )

            return serialized, ''
        except Exception:
            session.rollback()
            logger.exception('Error sending support message')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_threads_for_admin(session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            rows = (
                session.query(SupportThread)
                .options(joinedload(SupportThread.athlete))
                .filter(SupportThread.last_message_at.isnot(None))
                .order_by(SupportThread.last_message_at.desc(), SupportThread.created_at.desc())
                .all()
            )
            return [serialize_support_thread(r, include_athlete=True) for r in rows], ''
        except Exception:
            logger.exception('Error listing support threads')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_thread_for_athlete(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            thread = SupportService.get_thread(athlete_id, session=session)
            if thread is None:
                return None, [], ''
            messages, msg_error = SupportService.list_messages(athlete_id, session=session)
            if msg_error:
                return None, None, msg_error
            return serialize_support_thread(thread), messages, ''
        except Exception:
            logger.exception('Error getting athlete support thread')
            return None, None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_thread_for_admin(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            thread = SupportService.get_thread(athlete_id, session=session, include_athlete=True)
            if thread is None:
                return None, None, 'Conversación no encontrada'
            messages, msg_error = SupportService.list_messages(athlete_id, session=session)
            if msg_error:
                return None, None, msg_error
            return serialize_support_thread(thread, include_athlete=True), messages, ''
        except Exception:
            logger.exception('Error getting admin support thread')
            return None, None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def mark_thread_read(athlete_id: int, reader_role: str, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            thread = session.query(SupportThread).filter_by(athlete_id=athlete_id).first()
            if thread is None:
                return {'updated': False}, ''

            now = datetime.now(timezone.utc)
            if reader_role == RoleEnum.ADMIN.value:
                (
                    session.query(SupportMessage)
                    .filter_by(athlete_id=athlete_id)
                    .filter(SupportMessage.sender_role == RoleEnum.USER.value)
                    .filter(SupportMessage.read_at.is_(None))
                    .update({'read_at': now})
                )
                thread.unread_for_admin = 0
            elif reader_role == RoleEnum.USER.value:
                (
                    session.query(SupportMessage)
                    .filter_by(athlete_id=athlete_id)
                    .filter(SupportMessage.sender_role == RoleEnum.ADMIN.value)
                    .filter(SupportMessage.read_at.is_(None))
                    .update({'read_at': now})
                )
                thread.unread_for_athlete = 0
            else:
                return None, 'Rol no autorizado'

            session.commit()
            return {'updated': True}, ''
        except Exception:
            session.rollback()
            logger.exception('Error marking support thread read')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
