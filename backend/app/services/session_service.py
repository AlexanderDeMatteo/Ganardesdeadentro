import json
import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import WorkoutSession
from app.schemas.serializers import serialize_session

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class SessionService:
    @staticmethod
    def mark_complete(athlete_id: int, payload: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            set_logs = payload.get('setLogs') or []
            workout = WorkoutSession(
                user_id=athlete_id,
                routine_id=int(payload['routineId']),
                assignment_id=int(payload['assignmentId']) if payload.get('assignmentId') else None,
                week_plan_id=int(payload['weekPlanId']) if payload.get('weekPlanId') else None,
                scheduled_date=payload.get('scheduledDate') or datetime.now(timezone.utc).date().isoformat(),
                date=datetime.fromisoformat(payload['date'].replace('Z', '+00:00'))
                if payload.get('date')
                else datetime.now(timezone.utc),
                set_logs=json.dumps(set_logs),
                completed=bool(payload.get('completed', True)),
                completed_sets=payload.get('completedSets', 0),
                failed_sets=payload.get('failedSets', 0),
                total_sets=payload.get('totalSets', len(set_logs)),
                session_outcome=payload.get('sessionOutcome', 'completed'),
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
