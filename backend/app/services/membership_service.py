import json
import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Membership, UserMembership
from app.schemas.serializers import serialize_active_membership, serialize_membership_plan

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class MembershipService:
    @staticmethod
    def get_active_membership(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            active = (
                session.query(UserMembership)
                .filter_by(user_id=athlete_id, is_active=True)
                .order_by(UserMembership.start_date.desc())
                .first()
            )
            if not active:
                return None, ''
            return serialize_active_membership(active), ''
        except Exception:
            logger.exception('Error getting active membership')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_plans(session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            plans = session.query(Membership).filter_by(is_active=True).order_by(Membership.id.asc()).all()
            return [serialize_membership_plan(plan) for plan in plans], ''
        except Exception:
            logger.exception('Error listing membership plans')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def create_plan(data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            plan = Membership(
                name=data.get('name'),
                description=data.get('description', ''),
                price=data.get('price', 0),
                features=json.dumps(data.get('features', [])),
                color=data.get('color', 'blue'),
                duration_days=data.get('durationDays', 30),
                is_active=True,
            )
            session.add(plan)
            session.commit()
            session.refresh(plan)
            return serialize_membership_plan(plan), ''
        except Exception:
            session.rollback()
            logger.exception('Error creating membership plan')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_plan(plan_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            plan = session.query(Membership).filter_by(id=plan_id).first()
            if not plan:
                return None, 'Plan no encontrado'
            if 'name' in patch:
                plan.name = patch['name']
            if 'description' in patch:
                plan.description = patch['description']
            if 'price' in patch:
                plan.price = patch['price']
            if 'features' in patch:
                plan.features = json.dumps(patch['features'])
            if 'color' in patch:
                plan.color = patch['color']
            if 'durationDays' in patch:
                plan.duration_days = patch['durationDays']
            plan.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(plan)
            return serialize_membership_plan(plan), ''
        except Exception:
            session.rollback()
            logger.exception('Error updating membership plan')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def delete_plan(plan_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            plan = session.query(Membership).filter_by(id=plan_id).first()
            if not plan:
                return False, 'Plan no encontrado'
            plan.is_active = False
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error deleting membership plan')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
