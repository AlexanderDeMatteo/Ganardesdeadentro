import json
import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Routine, WorkoutSession
from app.schemas.request_schemas import CompleteSessionSchema, parse_schema
from app.schemas.serializers import serialize_session
from app.utils.authorization import _athlete_has_routine_access

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class SessionService:
    @staticmethod
    def _validate_routine_for_athlete(athlete_id: int, routine_id: int, session) -> str | None:
        routine = session.query(Routine).filter_by(id=routine_id).first()
        if not routine:
            return 'Rutina no encontrada'
        if not _athlete_has_routine_access(session, athlete_id, routine_id):
            return 'Rutina no asignada al atleta'
        return None

    @staticmethod
    def mark_complete(athlete_id: int, payload: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            parsed, validation_error = parse_schema(CompleteSessionSchema, payload)
            if validation_error:
                return None, validation_error

            routine_error = SessionService._validate_routine_for_athlete(
                athlete_id,
                parsed.routineId,
                session,
            )
            if routine_error:
                return None, routine_error

            set_logs = [item.model_dump() for item in parsed.setLogs]
            total_sets = parsed.totalSets if parsed.totalSets is not None else len(set_logs)
            workout = WorkoutSession(
                user_id=athlete_id,
                routine_id=parsed.routineId,
                assignment_id=parsed.assignmentId,
                week_plan_id=parsed.weekPlanId,
                scheduled_date=parsed.scheduledDate or datetime.now(timezone.utc).date().isoformat(),
                date=datetime.fromisoformat(parsed.date.replace('Z', '+00:00'))
                if parsed.date
                else datetime.now(timezone.utc),
                set_logs=json.dumps(set_logs),
                completed=parsed.completed,
                completed_sets=parsed.completedSets,
                failed_sets=parsed.failedSets,
                total_sets=total_sets,
                session_outcome=parsed.sessionOutcome,
            )
            session.add(workout)
            session.commit()
            session.refresh(workout)
            return serialize_session(workout), ''
        except Exception:
            session.rollback()
            logger.exception('Error marking session complete')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_sessions(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            logs = (
                session.query(WorkoutSession)
                .filter_by(user_id=athlete_id)
                .order_by(WorkoutSession.date.desc())
                .all()
            )
            return [serialize_session(item) for item in logs], ''
        except Exception:
            logger.exception('Error listing sessions')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_sessions_for_week(athlete_id: int, week_start: str, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            logs = (
                session.query(WorkoutSession)
                .filter_by(user_id=athlete_id)
                .filter(WorkoutSession.scheduled_date >= week_start)
                .order_by(WorkoutSession.scheduled_date.asc())
                .all()
            )
            return [serialize_session(item) for item in logs], ''
        except Exception:
            logger.exception('Error listing week sessions')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_exercise_progress(athlete_id: int, exercise_id: str, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            logs, _ = SessionService.list_sessions(athlete_id, session=session)
            points = []
            for log in logs or []:
                max_weight = 0
                for set_log in log.get('setLogs', []):
                    if str(set_log.get('exerciseId')) != str(exercise_id):
                        continue
                    weight = set_log.get('weightKg') or 0
                    max_weight = max(max_weight, weight)
                if max_weight > 0:
                    points.append(
                        {
                            'date': log['scheduledDate'],
                            'maxWeightKg': max_weight,
                            'sessionId': log['id'],
                        }
                    )
            return points, ''
        except Exception:
            logger.exception('Error getting exercise progress')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
