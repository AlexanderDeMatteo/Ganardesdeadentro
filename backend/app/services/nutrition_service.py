import json
import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import CoachNutritionDraft, NutritionPlan
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
    def publish_plan(data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            athlete_id = int(data['athleteId'])
            plan = session.query(NutritionPlan).filter_by(user_id=athlete_id).first()
            if not plan:
                plan = NutritionPlan(user_id=athlete_id)
                session.add(plan)
            plan.macro_targets = json.dumps(data.get('macroTargets', {}))
            plan.meal_plan = json.dumps(data.get('mealPlan', {}))
            plan.slot_times = json.dumps(data.get('slotTimes', {}))
            plan.activity_level = data.get('activityLevel', 'moderate')
            plan.goal = data.get('goal', 'maintain')
            plan.calorie_adjustment = data.get('calorieAdjustment', 0)
            plan.published_at = datetime.now(timezone.utc)
            plan.published_by = str(data.get('publishedBy', 'coach'))
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
            row = session.query(CoachNutritionDraft).filter_by(user_id=athlete_id).first()
            if not row:
                row = CoachNutritionDraft(user_id=athlete_id)
                session.add(row)
            draft = {**default_coach_draft(), **draft, 'updatedAt': datetime.now(timezone.utc).isoformat()}
            row.draft = json.dumps(draft)
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
