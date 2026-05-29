import logging

from app.database import SessionLocal
from app.models import RoleEnum, User, UserRoutineAssignment

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class AdminService:
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
