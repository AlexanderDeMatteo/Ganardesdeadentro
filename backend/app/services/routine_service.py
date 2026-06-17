import json
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import joinedload

from app.database import SessionLocal
from app.models import (
    DifficultyEnum,
    Exercise,
    Routine,
    RoutineExercise,
    UserRoutineAssignment,
    WeeklyPlan,
)
from app.schemas.serializers import serialize_assignment, serialize_routine, serialize_weekly_plan

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class RoutineService:
    @staticmethod
    def _resolve_exercise(session, exercise_payload: dict) -> Exercise:
        exercise_db_id = exercise_payload.get('exerciseId') or exercise_payload.get('exercise_db_id')
        if not exercise_db_id:
            raise ValueError('exerciseId requerido')
        exercise = session.query(Exercise).filter_by(exercise_db_id=str(exercise_db_id)).first()
        if exercise:
            return exercise
        exercise = Exercise(
            exercise_db_id=str(exercise_db_id),
            name=exercise_payload.get('exerciseName') or exercise_payload.get('name') or 'Exercise',
            target_muscle=exercise_payload.get('targetMuscle') or 'general',
            equipment=exercise_payload.get('equipment') or 'body weight',
            difficulty=DifficultyEnum.BEGINNER,
        )
        session.add(exercise)
        session.flush()
        return exercise

    @staticmethod
    def list_routines_by_trainer(trainer_id: int | None = None, active_only: bool = True, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            query = session.query(Routine)
            if trainer_id is not None:
                query = query.filter_by(trainer_id=trainer_id)
            if active_only:
                query = query.filter_by(is_active=True)
            routines = query.order_by(Routine.created_at.desc()).all()
            return [serialize_routine(item) for item in routines], ''
        except Exception:
            logger.exception('Error listing routines')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_assignments(
        trainer_id: int | None = None,
        athlete_id: int | None = None,
        active_only: bool = True,
        session=None,
    ):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            query = session.query(UserRoutineAssignment)
            if trainer_id is not None:
                query = query.filter_by(trainer_id=trainer_id)
            if athlete_id is not None:
                query = query.filter_by(user_id=athlete_id)
            if active_only:
                query = query.filter_by(is_active=True)
            assignments = query.order_by(UserRoutineAssignment.assigned_date.desc()).all()
            return [serialize_assignment(item) for item in assignments], ''
        except Exception:
            logger.exception('Error listing assignments')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_my_routine(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            assignment = (
                session.query(UserRoutineAssignment)
                .filter_by(user_id=athlete_id, is_active=True)
                .order_by(UserRoutineAssignment.assigned_date.desc())
                .first()
            )
            if not assignment:
                return {'assignment': None, 'routine': None}, ''
            routine = session.query(Routine).filter_by(id=assignment.routine_id).first()
            return {
                'assignment': serialize_assignment(assignment),
                'routine': serialize_routine(routine) if routine else None,
            }, ''
        except Exception:
            logger.exception('Error getting my routine')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_routine_by_id(routine_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            routine = session.query(Routine).filter_by(id=routine_id).first()
            if not routine:
                return None, 'Rutina no encontrada'
            return serialize_routine(routine), ''
        except Exception:
            logger.exception('Error getting routine')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def create_routine(data: dict, creator_id: int, creator_role: str, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            routine = Routine(
                name=data.get('name', 'Nueva rutina'),
                description=data.get('description', ''),
                difficulty=DifficultyEnum(data.get('difficulty', 'beginner')),
                duration_minutes=data.get('duration') or data.get('duration_minutes') or 0,
                is_active=True,
            )
            if creator_role == 'trainer':
                routine.trainer_id = creator_id
            else:
                routine.admin_id = creator_id
            session.add(routine)
            session.flush()
            for index, exercise_payload in enumerate(data.get('exercises', [])):
                exercise = RoutineService._resolve_exercise(session, exercise_payload)
                suggested = exercise_payload.get('suggestedWeightsKg') or []
                session.add(
                    RoutineExercise(
                        routine_id=routine.id,
                        exercise_id=exercise.id,
                        order=index + 1,
                        sets=int(exercise_payload.get('sets', 3)),
                        reps=int(exercise_payload.get('reps', 10)),
                        rest_seconds=int(exercise_payload.get('rest', 60)),
                        suggested_weights=json.dumps(suggested),
                        technique=exercise_payload.get('technique'),
                    )
                )
            session.commit()
            routine = (
                session.query(Routine)
                .options(joinedload(Routine.exercises).joinedload(RoutineExercise.exercise))
                .filter_by(id=routine.id)
                .first()
            )
            return serialize_routine(routine), ''
        except ValueError:
            session.rollback()
            logger.exception('Invalid routine payload')
            return None, 'Datos de rutina inválidos'
        except Exception:
            session.rollback()
            logger.exception('Error creating routine')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_routine(routine_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            routine = session.query(Routine).filter_by(id=routine_id).first()
            if not routine:
                return None, 'Rutina no encontrada'
            if 'name' in patch:
                routine.name = patch['name']
            if 'description' in patch:
                routine.description = patch['description']
            if 'difficulty' in patch:
                routine.difficulty = DifficultyEnum(patch['difficulty'])
            if 'duration' in patch:
                routine.duration_minutes = patch['duration']
            if 'exercises' in patch:
                session.query(RoutineExercise).filter_by(routine_id=routine.id).delete()
                for index, exercise_payload in enumerate(patch['exercises']):
                    exercise = RoutineService._resolve_exercise(session, exercise_payload)
                    suggested = exercise_payload.get('suggestedWeightsKg') or []
                    session.add(
                        RoutineExercise(
                            routine_id=routine.id,
                            exercise_id=exercise.id,
                            order=index + 1,
                            sets=exercise_payload.get('sets', 3),
                            reps=exercise_payload.get('reps', 10),
                            rest_seconds=exercise_payload.get('rest', 60),
                            suggested_weights=json.dumps(suggested),
                            technique=exercise_payload.get('technique'),
                        )
                    )
            routine.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(routine)
            return serialize_routine(routine), ''
        except Exception:
            session.rollback()
            logger.exception('Error updating routine')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def delete_routine(routine_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            routine = session.query(Routine).filter_by(id=routine_id).first()
            if not routine:
                return False, 'Rutina no encontrada'
            session.delete(routine)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error deleting routine')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def assign_routine(athlete_id: int, routine_id: int, trainer_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            routine = session.query(Routine).filter_by(id=routine_id).first()
            if not routine:
                return None, 'Rutina no encontrada'
            session.query(UserRoutineAssignment).filter_by(user_id=athlete_id, is_active=True).update(
                {'is_active': False}
            )
            assignment = UserRoutineAssignment(
                user_id=athlete_id,
                routine_id=routine_id,
                trainer_id=trainer_id,
                is_active=True,
            )
            session.add(assignment)
            session.commit()
            session.refresh(assignment)
            return serialize_assignment(assignment), ''
        except Exception:
            session.rollback()
            logger.exception('Error assigning routine')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def unassign_routine(assignment_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            assignment = session.query(UserRoutineAssignment).filter_by(id=assignment_id).first()
            if not assignment:
                return False, 'Asignación no encontrada'
            assignment.is_active = False
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error unassigning routine')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def list_active_weekly_plans(trainer_id: int | None = None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            query = session.query(WeeklyPlan).filter_by(is_active=True)
            if trainer_id is not None:
                query = query.filter_by(trainer_id=trainer_id)
            plans = query.order_by(WeeklyPlan.created_at.desc()).all()
            seen_athletes: set[int] = set()
            unique_plans = []
            for plan in plans:
                if plan.user_id in seen_athletes:
                    continue
                seen_athletes.add(plan.user_id)
                unique_plans.append(plan)
            return [serialize_weekly_plan(plan) for plan in unique_plans], ''
        except Exception:
            logger.exception('Error listing active weekly plans')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_weekly_plan(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            plan = (
                session.query(WeeklyPlan)
                .filter_by(user_id=athlete_id, is_active=True)
                .order_by(WeeklyPlan.created_at.desc())
                .first()
            )
            if not plan:
                return None, ''
            return serialize_weekly_plan(plan), ''
        except Exception:
            logger.exception('Error getting weekly plan')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def assign_weekly_plan(athlete_id: int, trainer_id: int, days: list, week_start_date: str, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            session.query(WeeklyPlan).filter_by(user_id=athlete_id, is_active=True).update({'is_active': False})
            plan = WeeklyPlan(
                user_id=athlete_id,
                trainer_id=trainer_id,
                week_start_date=week_start_date,
                days=json.dumps(days),
                is_active=True,
            )
            session.add(plan)
            session.commit()
            session.refresh(plan)
            return serialize_weekly_plan(plan), ''
        except Exception:
            session.rollback()
            logger.exception('Error assigning weekly plan')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
