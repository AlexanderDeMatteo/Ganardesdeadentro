import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import Membership, RoleEnum, User, UserMembership
from app.schemas.serializers import (
    VALID_FUNCTIONAL_TIERS,
    _membership_level_from_name,
    _membership_level_from_plan,
    _normalize_functional_tier,
    serialize_active_membership,
    serialize_me_membership,
    serialize_membership_plan,
)

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'
DUPLICATE_NAME_ERROR = 'Ya existe un plan con ese nombre'
INVALID_NAME_ERROR = 'El nombre no puede superar 120 caracteres'
INVALID_TIER_ERROR = 'functionalTier inválido; use basic, premium o pro'


class MembershipService:
    @staticmethod
    def _validate_plan_name(name: str | None) -> tuple[str | None, str]:
        cleaned = (name or '').strip()
        if not cleaned:
            return None, 'name requerido'
        if len(cleaned) > 120:
            return None, INVALID_NAME_ERROR
        return cleaned, ''

    @staticmethod
    def _validate_functional_tier(value) -> tuple[str | None, str]:
        if value is None:
            return 'basic', ''
        normalized = str(value).lower()
        if normalized not in VALID_FUNCTIONAL_TIERS:
            return None, INVALID_TIER_ERROR
        return normalized, ''
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
    def get_me_membership(user_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            active = (
                session.query(UserMembership)
                .filter_by(user_id=user_id, is_active=True)
                .order_by(UserMembership.start_date.desc())
                .first()
            )
            if not active:
                return None, ''
            return serialize_me_membership(active), ''
        except Exception:
            logger.exception('Error getting membership for auth me')
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
            name, name_error = MembershipService._validate_plan_name(data.get('name'))
            if name_error:
                return None, name_error
            functional_tier, tier_error = MembershipService._validate_functional_tier(data.get('functionalTier'))
            if tier_error:
                return None, tier_error
            if data.get('functionalTier') is None:
                functional_tier = _membership_level_from_name(name)
            plan = Membership(
                name=name,
                functional_tier=functional_tier,
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
        except IntegrityError:
            session.rollback()
            return None, DUPLICATE_NAME_ERROR
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
                name, name_error = MembershipService._validate_plan_name(patch['name'])
                if name_error:
                    return None, name_error
                plan.name = name
            if 'functionalTier' in patch:
                functional_tier, tier_error = MembershipService._validate_functional_tier(patch['functionalTier'])
                if tier_error:
                    return None, tier_error
                plan.functional_tier = functional_tier
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
        except IntegrityError:
            session.rollback()
            return None, DUPLICATE_NAME_ERROR
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

    @staticmethod
    def _resolve_plan_by_level(session, level: str) -> Membership | None:
        normalized = str(level).lower()
        plans = session.query(Membership).filter_by(is_active=True).order_by(Membership.id.asc()).all()
        for plan in plans:
            if _membership_level_from_plan(plan) == normalized:
                return plan
        return None

    @staticmethod
    def assign_membership(user_id: int, plan_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            user = session.query(User).filter_by(id=user_id, role=RoleEnum.USER).first()
            if not user:
                return None, 'Atleta no encontrado'

            plan = session.query(Membership).filter_by(id=plan_id, is_active=True).first()
            if not plan:
                return None, 'Plan no encontrado'

            now = datetime.now(timezone.utc)
            session.query(UserMembership).filter_by(user_id=user_id, is_active=True).update({'is_active': False})
            membership = UserMembership(
                user_id=user_id,
                membership_id=plan.id,
                start_date=now,
                end_date=now + timedelta(days=plan.duration_days or 30),
                is_active=True,
                auto_renew=False,
            )
            session.add(membership)
            session.commit()
            session.refresh(membership)
            return serialize_active_membership(membership), ''
        except Exception:
            session.rollback()
            logger.exception('Error assigning membership')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def assign_membership_by_level(user_id: int, level: str, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            plan = MembershipService._resolve_plan_by_level(session, level)
            if plan is None:
                return None, 'Plan de membresía no encontrado'
            return MembershipService.assign_membership(user_id, plan.id, session=session)
        finally:
            if close_session:
                session.close()

    @staticmethod
    def revoke_membership(user_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            updated = (
                session.query(UserMembership)
                .filter_by(user_id=user_id, is_active=True)
                .update({'is_active': False})
            )
            session.commit()
            if updated == 0:
                return False, 'No hay membresía activa'
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error revoking membership')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
