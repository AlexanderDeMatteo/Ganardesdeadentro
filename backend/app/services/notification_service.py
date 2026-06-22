import json
import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Notification, RoleEnum, SupportMessage, SupportThread, User
from app.realtime.emit import emit_to_user
from app.schemas.serializers import serialize_notification

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class NotificationService:
    @staticmethod
    def create(user_id: int, type_: str, title: str, body: str = '', data: dict | None = None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            payload_data = data or {}
            row = Notification(
                user_id=user_id,
                type=type_,
                title=title,
                body=body or '',
                data=json.dumps(payload_data),
            )
            session.add(row)
            session.commit()
            session.refresh(row)
            serialized = serialize_notification(row)
            emit_to_user(user_id, 'notification', serialized)
            return serialized, ''
        except Exception:
            session.rollback()
            logger.exception('Error creating notification')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_for_user(user_id: int, limit: int = 50, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            rows = (
                session.query(Notification)
                .filter_by(user_id=user_id)
                .order_by(Notification.created_at.desc())
                .limit(max(1, min(limit, 100)))
                .all()
            )
            return [serialize_notification(r) for r in rows], ''
        except Exception:
            logger.exception('Error listing notifications')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def unread_count(user_id: int, session=None) -> tuple[int, str]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            count = (
                session.query(Notification)
                .filter_by(user_id=user_id)
                .filter(Notification.read_at.is_(None))
                .count()
            )
            return count, ''
        except Exception:
            logger.exception('Error counting unread notifications')
            return 0, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def mark_read(notification_id: int, user_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            row = (
                session.query(Notification)
                .filter_by(id=notification_id, user_id=user_id)
                .first()
            )
            if not row:
                return None, 'Notificación no encontrada'
            if row.read_at is None:
                row.read_at = datetime.now(timezone.utc)
                session.commit()
                session.refresh(row)
            return serialize_notification(row), ''
        except Exception:
            session.rollback()
            logger.exception('Error marking notification read')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def mark_all_read(user_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            now = datetime.now(timezone.utc)
            (
                session.query(Notification)
                .filter_by(user_id=user_id)
                .filter(Notification.read_at.is_(None))
                .update({'read_at': now})
            )
            session.commit()
            return {'updated': True}, ''
        except Exception:
            session.rollback()
            logger.exception('Error marking all notifications read')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def notify_admins(type_: str, title: str, body: str = '', data: dict | None = None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            admins = session.query(User).filter_by(role=RoleEnum.ADMIN, is_active=True).all()
            results = []
            for admin in admins:
                created, error = NotificationService.create(
                    admin.id,
                    type_,
                    title,
                    body,
                    data,
                    session=session,
                )
                if error:
                    return None, error
                results.append(created)
            return results, ''
        except Exception:
            logger.exception('Error notifying admins')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
