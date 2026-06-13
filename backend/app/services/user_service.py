import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import RoleEnum, User, UserMembership, UserProfile
from app.schemas.serializers import serialize_athlete, serialize_trainer
from app.services.membership_service import MembershipService
from app.services.metrics_service import MetricsService
from app.utils.validation import validate_email

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class UserService:
    @staticmethod
    def get_trainer_athletes(trainer_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            athletes = (
                session.query(User)
                .filter_by(trainer_id=trainer_id, role=RoleEnum.USER)
                .all()
            )
            latest_map = MetricsService.get_latest_metrics_for_users(
                [athlete.id for athlete in athletes],
                session=session,
            )
            result = []
            for athlete in athletes:
                active = (
                    session.query(UserMembership)
                    .filter_by(user_id=athlete.id, is_active=True)
                    .first()
                )
                result.append(
                    serialize_athlete(
                        athlete,
                        active_membership=active,
                        latest_metric=latest_map.get(athlete.id),
                    )
                )
            return result, ''
        except Exception:
            logger.exception('Error listing trainer athletes')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_athlete_by_id(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            athlete = session.query(User).filter_by(id=athlete_id, role=RoleEnum.USER).first()
            if not athlete:
                return None, 'Atleta no encontrado'
            active = (
                session.query(UserMembership)
                .filter_by(user_id=athlete.id, is_active=True)
                .first()
            )
            latest = MetricsService.get_latest_metric(athlete.id, session=session)
            return serialize_athlete(athlete, active_membership=active, latest_metric=latest), ''
        except Exception:
            logger.exception('Error getting athlete')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_trainer_by_id(trainer_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            trainer = session.query(User).filter_by(id=trainer_id, role=RoleEnum.TRAINER).first()
            if not trainer:
                return None, 'Entrenador no encontrado'
            count = session.query(User).filter_by(trainer_id=trainer.id, role=RoleEnum.USER).count()
            return serialize_trainer(trainer, athlete_count=count), ''
        except Exception:
            logger.exception('Error getting trainer')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_athlete(athlete_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            athlete = session.query(User).filter_by(id=athlete_id, role=RoleEnum.USER).first()
            if not athlete:
                return None, 'Atleta no encontrado'
            profile = athlete.profile or UserProfile(user_id=athlete.id)
            if athlete.profile is None:
                session.add(profile)
            if 'name' in patch:
                parts = str(patch['name']).split(' ', 1)
                athlete.first_name = parts[0]
                athlete.last_name = parts[1] if len(parts) > 1 else ''
            if 'email' in patch:
                email_error = validate_email(str(patch['email']))
                if email_error:
                    return None, email_error
                normalized_email = str(patch['email']).strip().lower()
                existing = (
                    session.query(User)
                    .filter(User.email == normalized_email, User.id != athlete.id)
                    .first()
                )
                if existing:
                    return None, 'El email ya está registrado'
                athlete.email = normalized_email
            if 'age' in patch:
                profile.age = patch['age']
            if 'gender' in patch:
                profile.gender = patch['gender']
            if 'weight' in patch:
                profile.initial_weight = patch['weight']
            if 'height' in patch:
                profile.initial_height = patch['height']
            if 'membershipLevel' in patch:
                level = str(patch['membershipLevel']).lower()
                if level == 'basic':
                    _, membership_error = MembershipService.revoke_membership(athlete.id, session=session)
                    if membership_error and membership_error != 'No hay membresía activa':
                        return None, membership_error
                else:
                    _, membership_error = MembershipService.assign_membership_by_level(
                        athlete.id,
                        level,
                        session=session,
                    )
                    if membership_error:
                        return None, membership_error
            athlete.updated_at = datetime.now(timezone.utc)
            session.commit()
            active = (
                session.query(UserMembership)
                .filter_by(user_id=athlete.id, is_active=True)
                .first()
            )
            latest = MetricsService.get_latest_metric(athlete.id, session=session)
            return serialize_athlete(athlete, active_membership=active, latest_metric=latest), ''
        except Exception:
            session.rollback()
            logger.exception('Error updating athlete')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_me_profile(user_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                return None, 'Usuario no encontrado'
            if not user.is_active:
                return None, 'La cuenta ha sido desactivada'
            if 'first_name' in patch and patch['first_name'] is not None:
                first_name = str(patch['first_name']).strip()
                if not first_name:
                    return None, 'Nombre inválido'
                user.first_name = first_name
            if 'last_name' in patch and patch['last_name'] is not None:
                user.last_name = str(patch['last_name']).strip()
            user.updated_at = datetime.now(timezone.utc)
            session.commit()
            role = user.role.value if hasattr(user.role, 'value') else str(user.role)
            return {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': role,
            }, ''
        except Exception:
            session.rollback()
            logger.exception('Error updating profile')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def assign_trainer_to_athlete(athlete_id: int, trainer_id: int | None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            athlete = session.query(User).filter_by(id=athlete_id, role=RoleEnum.USER).first()
            if not athlete:
                return False, 'Atleta no encontrado'
            if trainer_id is None:
                athlete.trainer_id = None
            else:
                trainer = session.query(User).filter_by(
                    id=trainer_id,
                    role=RoleEnum.TRAINER,
                    is_active=True,
                ).first()
                if not trainer:
                    return False, 'Entrenador no encontrado'
                athlete.trainer_id = trainer_id
            athlete.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error assigning trainer')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_my_trainer(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            athlete = session.query(User).filter_by(id=athlete_id, role=RoleEnum.USER).first()
            if not athlete or not athlete.trainer_id:
                return None, ''
            trainer = session.query(User).filter_by(id=athlete.trainer_id).first()
            if not trainer:
                return None, 'Entrenador no encontrado'
            count = session.query(User).filter_by(trainer_id=trainer.id, role=RoleEnum.USER).count()
            return serialize_trainer(trainer, athlete_count=count), ''
        except Exception:
            logger.exception('Error getting my trainer')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def _serialize_body_profile(profile: UserProfile | None) -> dict:
        if profile is None:
            return {}
        sex = None
        if profile.gender in ('male', 'female'):
            sex = profile.gender
        result = {}
        if profile.initial_height is not None:
            result['heightCm'] = profile.initial_height
        if profile.age is not None:
            result['age'] = profile.age
        if sex is not None:
            result['sex'] = sex
        return result

    @staticmethod
    def get_body_profile(user_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            user = session.query(User).filter_by(id=user_id, role=RoleEnum.USER).first()
            if not user:
                return None, 'Atleta no encontrado'
            return UserService._serialize_body_profile(user.profile), ''
        except Exception:
            logger.exception('Error getting body profile')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_body_profile(user_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            user = session.query(User).filter_by(id=user_id, role=RoleEnum.USER).first()
            if not user:
                return None, 'Atleta no encontrado'
            profile = user.profile or UserProfile(user_id=user.id)
            if user.profile is None:
                session.add(profile)
            if 'heightCm' in patch and patch['heightCm'] is not None:
                profile.initial_height = float(patch['heightCm'])
            if 'age' in patch and patch['age'] is not None:
                profile.age = int(patch['age'])
            if 'sex' in patch and patch['sex'] is not None:
                profile.gender = patch['sex']
            profile.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(profile)
            return UserService._serialize_body_profile(profile), ''
        except Exception:
            session.rollback()
            logger.exception('Error updating body profile')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_trainer_profile(trainer_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            trainer = session.query(User).filter_by(id=trainer_id, role=RoleEnum.TRAINER).first()
            if not trainer:
                return False, 'Entrenador no encontrado'
            profile = trainer.profile or UserProfile(user_id=trainer.id)
            if trainer.profile is None:
                session.add(profile)
            if 'specialization' in patch:
                profile.specialization = patch['specialization']
            if 'bio' in patch:
                profile.bio = patch['bio']
            profile.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error updating trainer profile')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
