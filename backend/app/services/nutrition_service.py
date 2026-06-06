import json
import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import CoachNutritionDraft, NutritionPlan, RoleEnum, User
from app.schemas.request_schemas import CoachDraftSchema, PublishPlanSchema, parse_schema
from app.schemas.serializers import default_coach_draft, serialize_coach_draft, serialize_nutrition_plan

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class NutritionService:
    @staticmethod
    def get_plan(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            plan = session.query(NutritionPlan).filter_by(user_id=athlete_id).first()
            if not plan:
                return None, ''
            return serialize_nutrition_plan(plan), ''
        except Exception:
            logger.exception('Error getting nutrition plan')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def validate_athlete_target(athlete_id: int, session) -> str | None:
        athlete = session.query(User).filter_by(id=athlete_id).first()
        if not athlete:
            return 'Atleta no encontrado'
        if athlete.role != RoleEnum.USER:
            return 'El usuario no es un atleta'
        return None

    @staticmethod
    def publish_plan(data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            parsed, validation_error = parse_schema(PublishPlanSchema, data)
            if validation_error:
                return None, validation_error

            athlete_error = NutritionService.validate_athlete_target(parsed.athleteId, session)
            if athlete_error:
                return None, athlete_error

            athlete_id = parsed.athleteId
            plan = session.query(NutritionPlan).filter_by(user_id=athlete_id).first()
            if not plan:
                plan = NutritionPlan(user_id=athlete_id)
                session.add(plan)
            plan.macro_targets = json.dumps(parsed.macroTargets.model_dump() if hasattr(parsed.macroTargets, 'model_dump') else parsed.macroTargets)
            plan.meal_plan = json.dumps(parsed.mealPlan)
            plan.slot_times = json.dumps(parsed.slotTimes)
            plan.activity_level = parsed.activityLevel
            plan.goal = parsed.goal
            plan.calorie_adjustment = parsed.calorieAdjustment
            plan.published_at = datetime.now(timezone.utc)
            plan.published_by = parsed.publishedBy
            plan.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(plan)
            return serialize_nutrition_plan(plan), ''
        except Exception:
            session.rollback()
            logger.exception('Error publishing nutrition plan')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_coach_draft(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            draft = session.query(CoachNutritionDraft).filter_by(user_id=athlete_id).first()
            return serialize_coach_draft(draft), ''
        except Exception:
            logger.exception('Error getting coach draft')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def save_coach_draft(athlete_id: int, draft: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            parsed, validation_error = parse_schema(CoachDraftSchema, draft)
            if validation_error:
                return None, validation_error

            row = session.query(CoachNutritionDraft).filter_by(user_id=athlete_id).first()
            if not row:
                row = CoachNutritionDraft(user_id=athlete_id)
                session.add(row)
            merged = {
                **default_coach_draft(),
                **parsed.model_dump(),
                'updatedAt': datetime.now(timezone.utc).isoformat(),
            }
            row.draft = json.dumps(merged)
            row.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(row)
            return serialize_coach_draft(row), ''
        except Exception:
            session.rollback()
            logger.exception('Error saving coach draft')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
