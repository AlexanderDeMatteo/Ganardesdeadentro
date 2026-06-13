import json
import logging
import uuid
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import NutritionDiary
from app.schemas.request_schemas import DiaryEntryPostSchema, DiaryPutSchema, DiaryWaterPatchSchema, parse_schema
from app.schemas.serializers import default_nutrition_diary, serialize_nutrition_diary

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'
MAX_ITEMS_PER_DAY = 200


class NutritionDiaryService:
    @staticmethod
    def _get_or_create(athlete_id: int, session):
        diary = session.query(NutritionDiary).filter_by(user_id=athlete_id).first()
        if diary:
            return diary
        diary = NutritionDiary(
            user_id=athlete_id,
            food_log='[]',
            water_by_date='{}',
            water_goal_ml=2500,
        )
        session.add(diary)
        session.flush()
        return diary

    @staticmethod
    def _load_food_log(diary: NutritionDiary) -> list:
        try:
            data = json.loads(diary.food_log or '[]')
            return data if isinstance(data, list) else []
        except (TypeError, json.JSONDecodeError):
            return []

    @staticmethod
    def _load_water_by_date(diary: NutritionDiary) -> dict:
        try:
            data = json.loads(diary.water_by_date or '{}')
            return data if isinstance(data, dict) else {}
        except (TypeError, json.JSONDecodeError):
            return {}

    @staticmethod
    def _save_diary_state(diary: NutritionDiary, food_log: list, water_by_date: dict, water_goal_ml: int | None = None):
        diary.food_log = json.dumps(food_log)
        diary.water_by_date = json.dumps(water_by_date)
        if water_goal_ml is not None:
            diary.water_goal_ml = water_goal_ml
        diary.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def get_diary(athlete_id: int, date: str | None = None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            diary = session.query(NutritionDiary).filter_by(user_id=athlete_id).first()
            return serialize_nutrition_diary(diary, date=date), ''
        except Exception:
            logger.exception('Error getting nutrition diary')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def upsert_diary(data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            parsed, validation_error = parse_schema(DiaryPutSchema, data)
            if validation_error:
                return None, validation_error

            diary = NutritionDiaryService._get_or_create(parsed.athleteId, session)
            food_log = [entry.model_dump() for entry in parsed.foodLog]
            NutritionDiaryService._save_diary_state(
                diary,
                food_log,
                parsed.waterByDate,
                parsed.waterGoalMl,
            )
            session.commit()
            session.refresh(diary)
            return serialize_nutrition_diary(diary), ''
        except Exception:
            session.rollback()
            logger.exception('Error upserting nutrition diary')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def add_entry(data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            parsed, validation_error = parse_schema(DiaryEntryPostSchema, data)
            if validation_error:
                return None, validation_error

            diary = NutritionDiaryService._get_or_create(parsed.athleteId, session)
            food_log = NutritionDiaryService._load_food_log(diary)
            water_by_date = NutritionDiaryService._load_water_by_date(diary)

            entry_idx = next((i for i, e in enumerate(food_log) if e.get('date') == parsed.date), None)
            item = parsed.item.model_dump()
            item['id'] = item.get('id') or f'entry-{uuid.uuid4().hex[:12]}'

            if entry_idx is None:
                if len([{'date': parsed.date, 'items': [item]}]) > MAX_ITEMS_PER_DAY:
                    return None, 'Límite de entradas por día alcanzado'
                food_log.append({'date': parsed.date, 'items': [item]})
            else:
                items = food_log[entry_idx].get('items', [])
                if not isinstance(items, list):
                    items = []
                if len(items) >= MAX_ITEMS_PER_DAY:
                    return None, 'Límite de entradas por día alcanzado'
                items.append(item)
                food_log[entry_idx]['items'] = items

            NutritionDiaryService._save_diary_state(diary, food_log, water_by_date)
            session.commit()
            session.refresh(diary)
            return serialize_nutrition_diary(diary), ''
        except Exception:
            session.rollback()
            logger.exception('Error adding diary entry')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def delete_entry(athlete_id: int, entry_id: str, date: str | None = None, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            diary = session.query(NutritionDiary).filter_by(user_id=athlete_id).first()
            if not diary:
                return None, 'Entrada no encontrada'

            food_log = NutritionDiaryService._load_food_log(diary)
            water_by_date = NutritionDiaryService._load_water_by_date(diary)
            removed = False

            for entry in food_log:
                if date and entry.get('date') != date:
                    continue
                items = entry.get('items', [])
                if not isinstance(items, list):
                    continue
                filtered = [item for item in items if item.get('id') != entry_id]
                if len(filtered) != len(items):
                    entry['items'] = filtered
                    removed = True

            food_log = [entry for entry in food_log if entry.get('items')]

            if not removed:
                return None, 'Entrada no encontrada'

            NutritionDiaryService._save_diary_state(diary, food_log, water_by_date)
            session.commit()
            session.refresh(diary)
            return serialize_nutrition_diary(diary), ''
        except Exception:
            session.rollback()
            logger.exception('Error deleting diary entry')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def patch_water(data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            parsed, validation_error = parse_schema(DiaryWaterPatchSchema, data)
            if validation_error:
                return None, validation_error
            if parsed.ml is None and parsed.mlDelta is None and parsed.goalMl is None:
                return None, 'ml, mlDelta o goalMl requerido'

            diary = NutritionDiaryService._get_or_create(parsed.athleteId, session)
            food_log = NutritionDiaryService._load_food_log(diary)
            water_by_date = NutritionDiaryService._load_water_by_date(diary)

            if parsed.ml is not None:
                water_by_date[parsed.date] = parsed.ml
            elif parsed.mlDelta is not None:
                current = water_by_date.get(parsed.date, 0)
                water_by_date[parsed.date] = max(0, int(current) + parsed.mlDelta)

            goal_ml = parsed.goalMl if parsed.goalMl is not None else diary.water_goal_ml
            NutritionDiaryService._save_diary_state(diary, food_log, water_by_date, goal_ml)
            session.commit()
            session.refresh(diary)
            return serialize_nutrition_diary(diary), ''
        except Exception:
            session.rollback()
            logger.exception('Error patching diary water')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()
