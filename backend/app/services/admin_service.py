import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from app.database import SessionLocal
from app.models import (
    InvitationToken,
    Membership,
    MetricsHistory,
    RoleEnum,
    User,
    UserMembership,
    UserProfile,
    UserRoutineAssignment,
    WorkoutSession,
)
from app.schemas.serializers import _membership_level_from_plan, serialize_athlete, serialize_trainer
from app.services.email_service import EmailService
from app.services.invitation_service import InvitationService, TRAINER_INVITE_PURPOSE
from app.services.metrics_service import MetricsService
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'
DAY_LABELS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D']


def _priority_from_level(level: str) -> str:
    if level == 'pro':
        return 'ALTA'
    if level == 'premium':
        return 'MEDIA'
    return 'BAJA'


def _monthly_mrr_from_plan(membership: Membership) -> float:
    price = membership.price or 0
    duration = membership.duration_days or 30
    if duration <= 0:
        duration = 30
    return float(price) / duration * 30


def _as_utc_aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _days_since(reference: datetime, past: datetime | None) -> int:
    if past is None:
        return 999
    ref = _as_utc_aware(reference)
    past_utc = _as_utc_aware(past)
    if ref is None or past_utc is None:
        return 999
    return max(0, (ref - past_utc).days)


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
    def get_dashboard_metrics(session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            now = datetime.now(timezone.utc)
            today = now.date()
            week_start = now - timedelta(days=6)
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            thirty_days_ago = now - timedelta(days=30)
            sixty_days_ago = now - timedelta(days=60)
            expiring_cutoff = today + timedelta(days=5)
            inactive_cutoff = now - timedelta(days=7)

            active_memberships = (
                session.query(UserMembership)
                .filter_by(is_active=True)
                .all()
            )
            active_count = len(active_memberships)
            estimated_mrr = 0.0
            for user_membership in active_memberships:
                if user_membership.membership:
                    estimated_mrr += _monthly_mrr_from_plan(user_membership.membership)

            recent_new = (
                session.query(UserMembership)
                .filter(
                    UserMembership.is_active.is_(True),
                    UserMembership.start_date >= thirty_days_ago,
                )
                .count()
            )
            prior_new = (
                session.query(UserMembership)
                .filter(
                    UserMembership.is_active.is_(True),
                    UserMembership.start_date >= sixty_days_ago,
                    UserMembership.start_date < thirty_days_ago,
                )
                .count()
            )
            mrr_trend_percent = (
                round((recent_new - prior_new) / prior_new * 100) if prior_new > 0 else 0
            )

            trainers = session.query(User).filter_by(role=RoleEnum.TRAINER).all()
            total_slots = 0
            for trainer in trainers:
                pending_invite = AdminService._has_pending_invite(trainer.id, session)
                if not trainer.is_active and not pending_invite:
                    continue
                profile = trainer.profile
                max_athletes = profile.max_athletes if profile and profile.max_athletes else 10
                total_slots += max_athletes

            current_load = (
                session.query(User)
                .filter(User.role == RoleEnum.USER, User.trainer_id.isnot(None))
                .count()
            )
            load_percent = round((current_load / total_slots) * 100) if total_slots > 0 else 0

            trend_7d = []
            for offset in range(6, -1, -1):
                day = today - timedelta(days=offset)
                day_start = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc)
                day_end = day_start + timedelta(days=1)
                session_count = (
                    session.query(WorkoutSession)
                    .filter(
                        WorkoutSession.completed.is_(True),
                        WorkoutSession.date >= day_start,
                        WorkoutSession.date < day_end,
                    )
                    .count()
                )
                trend_7d.append({
                    'day': DAY_LABELS_ES[day.weekday()],
                    'load': session_count,
                })

            athletes = session.query(User).filter_by(role=RoleEnum.USER).all()
            athlete_ids = [a.id for a in athletes]

            last_session_map = {}
            if athlete_ids:
                session_rows = (
                    session.query(WorkoutSession.user_id, func.max(WorkoutSession.date))
                    .filter(
                        WorkoutSession.user_id.in_(athlete_ids),
                        WorkoutSession.completed.is_(True),
                    )
                    .group_by(WorkoutSession.user_id)
                    .all()
                )
                last_session_map = {row[0]: row[1] for row in session_rows}

            last_metric_map = MetricsService.get_latest_metrics_for_users(athlete_ids, session=session)
            last_metric_date_map = {
                user_id: metric.measurement_date
                for user_id, metric in last_metric_map.items()
                if metric is not None
            }

            at_risk = []
            at_risk_ids = set()
            for athlete in athletes:
                active = (
                    session.query(UserMembership)
                    .filter_by(user_id=athlete.id, is_active=True)
                    .first()
                )
                days_remaining = None
                if active and active.end_date:
                    days_remaining = max(0, (active.end_date.date() - today).days)

                last_session = last_session_map.get(athlete.id)
                last_metric = last_metric_date_map.get(athlete.id)
                last_activity = None
                for candidate in (last_session, last_metric):
                    if candidate is None:
                        continue
                    candidate_utc = _as_utc_aware(candidate)
                    if candidate_utc is None:
                        continue
                    if last_activity is None or candidate_utc > last_activity:
                        last_activity = candidate_utc

                if last_activity is None:
                    inactive_days = _days_since(now, athlete.created_at)
                else:
                    inactive_days = _days_since(now, last_activity)

                if days_remaining is not None and days_remaining <= 5:
                    at_risk.append({
                        'athleteId': str(athlete.id),
                        'name': f'{athlete.first_name} {athlete.last_name}'.strip(),
                        'email': athlete.email,
                        'reason': 'expiring',
                        'daysRemaining': days_remaining,
                    })
                    at_risk_ids.add(athlete.id)
                elif inactive_days >= 7:
                    at_risk.append({
                        'athleteId': str(athlete.id),
                        'name': f'{athlete.first_name} {athlete.last_name}'.strip(),
                        'email': athlete.email,
                        'reason': 'inactive',
                        'inactiveDays': inactive_days,
                    })
                    at_risk_ids.add(athlete.id)

            at_risk.sort(
                key=lambda item: (
                    0 if item['reason'] == 'expiring' else 1,
                    item.get('daysRemaining', 999),
                    -(item.get('inactiveDays') or 0),
                ),
            )

            workouts_completed_this_week = (
                session.query(WorkoutSession)
                .filter(
                    WorkoutSession.completed.is_(True),
                    WorkoutSession.date >= week_start,
                )
                .count()
            )

            today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
            today_end = today_start + timedelta(days=1)
            metrics_logged_today = (
                session.query(MetricsHistory)
                .filter(
                    MetricsHistory.measurement_date >= today_start,
                    MetricsHistory.measurement_date < today_end,
                )
                .count()
            )

            weekly_bars = []
            for offset in range(6, -1, -1):
                day = today - timedelta(days=offset)
                day_start = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc)
                day_end = day_start + timedelta(days=1)
                count = (
                    session.query(WorkoutSession)
                    .filter(
                        WorkoutSession.completed.is_(True),
                        WorkoutSession.date >= day_start,
                        WorkoutSession.date < day_end,
                    )
                    .count()
                )
                weekly_bars.append({'day': DAY_LABELS_ES[day.weekday()], 'count': count})

            unassigned = []
            for athlete in athletes:
                if athlete.trainer_id is not None:
                    continue
                active = (
                    session.query(UserMembership)
                    .filter_by(user_id=athlete.id, is_active=True)
                    .first()
                )
                level = 'basic'
                if active and active.membership:
                    level = _membership_level_from_plan(active.membership)
                unassigned.append({
                    'id': str(athlete.id),
                    'name': f'{athlete.first_name} {athlete.last_name}'.strip(),
                    'email': athlete.email,
                    'joinDate': athlete.created_at.isoformat() if athlete.created_at else '',
                    'priority': _priority_from_level(level),
                })

            unassigned.sort(
                key=lambda item: (
                    0 if item['priority'] == 'ALTA' else 1 if item['priority'] == 'MEDIA' else 2,
                    item['name'],
                ),
            )

            return {
                'memberships': {
                    'activeCount': active_count,
                    'estimatedMrr': round(estimated_mrr, 2),
                    'mrrTrendPercent': mrr_trend_percent,
                },
                'capacity': {
                    'totalSlots': total_slots,
                    'currentLoad': current_load,
                    'loadPercent': load_percent,
                    'trend7d': trend_7d,
                },
                'retention': {
                    'atRisk': at_risk,
                },
                'telemetry': {
                    'workoutsCompletedThisWeek': workouts_completed_this_week,
                    'metricsLoggedToday': metrics_logged_today,
                    'weeklyBars': weekly_bars,
                },
                'operations': {
                    'unassigned': unassigned,
                },
            }, ''
        except Exception:
            logger.exception('Error getting admin dashboard metrics')
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
