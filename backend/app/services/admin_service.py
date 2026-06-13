import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import InvitationToken, RoleEnum, User, UserProfile, UserMembership, UserRoutineAssignment
from app.schemas.serializers import serialize_athlete, serialize_trainer
from app.services.email_service import EmailService
from app.services.invitation_service import InvitationService, TRAINER_INVITE_PURPOSE
from app.services.metrics_service import MetricsService
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class AdminService:
    @staticmethod
    def _has_pending_invite(trainer_id: int, session) -> bool:
        now = datetime.now(timezone.utc)
        pending = (
            session.query(InvitationToken)
            .filter(
                InvitationToken.user_id == trainer_id,
                InvitationToken.purpose == TRAINER_INVITE_PURPOSE,
                InvitationToken.used_at.is_(None),
                InvitationToken.expires_at > now,
            )
            .first()
        )
        return pending is not None

    @staticmethod
    def get_overview(session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            trainer_count = session.query(User).filter_by(role=RoleEnum.TRAINER).count()
            athlete_count = session.query(User).filter_by(role=RoleEnum.USER).count()
            assignment_count = session.query(UserRoutineAssignment).filter_by(is_active=True).count()
            athletes_without_trainer = (
                session.query(User)
                .filter_by(role=RoleEnum.USER, trainer_id=None)
                .count()
            )
            trainers = session.query(User).filter_by(role=RoleEnum.TRAINER).all()
            trainers_without_athletes = 0
            for trainer in trainers:
                count = session.query(User).filter_by(trainer_id=trainer.id, role=RoleEnum.USER).count()
                if count == 0:
                    trainers_without_athletes += 1
            return {
                'trainerCount': trainer_count,
                'athleteCount': athlete_count,
                'assignmentCount': assignment_count,
                'athletesWithoutTrainer': athletes_without_trainer,
                'trainersWithoutAthletes': trainers_without_athletes,
            }, ''
        except Exception:
            logger.exception('Error getting admin overview')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_athletes(session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            athletes = session.query(User).filter_by(role=RoleEnum.USER).order_by(User.id.asc()).all()
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
            logger.exception('Error listing admin athletes')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_trainers(include_inactive: bool = False, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            trainers = (
                session.query(User)
                .filter_by(role=RoleEnum.TRAINER)
                .order_by(User.id.asc())
                .all()
            )
            result = []
            for trainer in trainers:
                pending_invite = AdminService._has_pending_invite(trainer.id, session)
                if not include_inactive:
                    if not trainer.is_active and not pending_invite:
                        continue
                count = (
                    session.query(User)
                    .filter_by(trainer_id=trainer.id, role=RoleEnum.USER)
                    .count()
                )
                payload = serialize_trainer(trainer, athlete_count=count)
                payload['invitePending'] = pending_invite
                payload['isActive'] = bool(trainer.is_active)
                result.append(payload)
            return result, ''
        except Exception:
            logger.exception('Error listing admin trainers')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def create_trainer_invitation(
        email: str,
        first_name: str,
        last_name: str,
        specialization: str | None = None,
        session=None,
    ):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            trainer, error, raw_token = InvitationService.create_trainer_invitation(
                email=email,
                first_name=first_name,
                last_name=last_name,
                specialization=specialization,
                session=session,
            )
            if error:
                return None, error
            invite_url = EmailService.build_trainer_invite_url(raw_token)
            sent, email_error = EmailService.send_trainer_invitation(
                to=email.strip().lower(),
                first_name=first_name.strip(),
                invite_url=invite_url,
            )
            if not sent:
                return None, email_error or GENERIC_ERROR
            return trainer, ''
        except Exception:
            logger.exception('Error in admin create trainer invitation')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def resend_trainer_invite(trainer_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            raw_token, error = InvitationService.resend_trainer_invitation(trainer_id, session=session)
            if error:
                return False, error
            user = session.query(User).filter_by(id=trainer_id, role=RoleEnum.TRAINER).first()
            if not user:
                return False, 'Entrenador no encontrado'
            invite_url = EmailService.build_trainer_invite_url(raw_token)
            sent, email_error = EmailService.send_trainer_invitation(
                to=user.email,
                first_name=user.first_name,
                invite_url=invite_url,
            )
            if not sent:
                return False, email_error or GENERIC_ERROR
            return True, ''
        except Exception:
            logger.exception('Error resending trainer invite')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def deactivate_trainer(trainer_id: int, athlete_actions: list[dict], session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            trainer = session.query(User).filter_by(id=trainer_id, role=RoleEnum.TRAINER).first()
            if not trainer:
                return False, 'Entrenador no encontrado'
            if not trainer.is_active:
                return False, 'El entrenador ya está inactivo'

            assigned_athletes = (
                session.query(User)
                .filter_by(trainer_id=trainer.id, role=RoleEnum.USER)
                .all()
            )
            assigned_ids = {a.id for a in assigned_athletes}
            actions_by_id = {int(a['athleteId']): a for a in athlete_actions}

            if assigned_ids != set(actions_by_id.keys()):
                return False, 'Debe indicar una acción para cada atleta asignado'

            for athlete in assigned_athletes:
                action = actions_by_id[athlete.id]
                if action['action'] == 'unassign':
                    athlete.trainer_id = None
                elif action['action'] == 'reassign':
                    new_trainer_id = action.get('newTrainerId')
                    if new_trainer_id is None:
                        return False, 'newTrainerId requerido para reasignar'
                    new_trainer = (
                        session.query(User)
                        .filter_by(id=int(new_trainer_id), role=RoleEnum.TRAINER, is_active=True)
                        .first()
                    )
                    if not new_trainer or new_trainer.id == trainer.id:
                        return False, 'Entrenador de destino no válido'
                    athlete.trainer_id = new_trainer.id
                athlete.updated_at = datetime.now(timezone.utc)

            trainer.is_active = False
            trainer.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error deactivating trainer')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def reactivate_trainer(trainer_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            trainer = session.query(User).filter_by(id=trainer_id, role=RoleEnum.TRAINER).first()
            if not trainer:
                return False, 'Entrenador no encontrado'
            if trainer.is_active:
                return False, 'El entrenador ya está activo'
            trainer.is_active = True
            trainer.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error reactivating trainer')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_trainer_max_athletes(trainer_id: int, max_athletes: int, session=None):
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
            profile.max_athletes = max_athletes
            trainer.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error updating trainer capacity')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
