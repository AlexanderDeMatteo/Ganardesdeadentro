import logging

import requests
from datetime import datetime, timezone

from app.config import get_config
from app.database import SessionLocal
from app.models import Exercise

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'

config = get_config()


class ExerciseAPIService:
    """Servicio para integrar con ExerciseDB API."""

    BASE_URL = config.EXERCISEDB_API_URL
    API_KEY = config.EXERCISEDB_API_KEY
    API_HOST = config.EXERCISEDB_API_HOST

    @classmethod
    def get_headers(cls) -> dict:
        return {
            'x-rapidapi-key': cls.API_KEY,
            'x-rapidapi-host': cls.API_HOST,
        }

    @classmethod
    def get_exercises_by_muscle(cls, muscle: str, limit: int = 50) -> tuple[list[dict], str]:
        try:
            session = SessionLocal()
            cached_exercises = session.query(Exercise).filter_by(
                target_muscle=muscle.lower(),
                is_cached=True,
            ).limit(limit).all()

            if cached_exercises:
                session.close()
                return [
                    {
                        'id': ex.id,
                        'exercise_db_id': ex.exercise_db_id,
                        'name': ex.name,
                        'target_muscle': ex.target_muscle,
                        'equipment': ex.equipment,
                        'gif_url': ex.gif_url,
                        'difficulty': ex.difficulty,
                    }
                    for ex in cached_exercises
                ], ''

            session.close()

            url = f'{cls.BASE_URL}/exercises/targetMuscle/{muscle}'
            response = requests.get(url, headers=cls.get_headers(), timeout=10)

            if response.status_code != 200:
                logger.warning('ExerciseDB API returned status %s for muscle %s', response.status_code, muscle)
                return [], GENERIC_ERROR

            exercises = response.json()

            session = SessionLocal()
            for exercise_data in exercises[:limit]:
                existing = session.query(Exercise).filter_by(
                    exercise_db_id=exercise_data.get('id'),
                ).first()

                if not existing:
                    exercise = Exercise(
                        exercise_db_id=exercise_data.get('id'),
                        name=exercise_data.get('name', ''),
                        target_muscle=exercise_data.get('target', muscle).lower(),
                        equipment=exercise_data.get('equipment', ''),
                        gif_url=exercise_data.get('gifUrl', ''),
                        difficulty='beginner',
                        is_cached=True,
                        synced_at=datetime.now(timezone.utc),
                    )
                    session.add(exercise)

            session.commit()
            session.close()

            return exercises[:limit], ''

        except requests.exceptions.RequestException:
            logger.exception('ExerciseDB connection error for muscle %s', muscle)
            return [], GENERIC_ERROR
        except Exception:
            logger.exception('Unexpected error fetching exercises by muscle %s', muscle)
            return [], GENERIC_ERROR

    @classmethod
    def search_exercises(cls, query: str, limit: int = 20) -> tuple[list[dict], str]:
        try:
            session = SessionLocal()
            cached_exercises = session.query(Exercise).filter(
                Exercise.name.ilike(f'%{query}%'),
            ).limit(limit).all()

            if cached_exercises:
                session.close()
                return [
                    {
                        'id': ex.id,
                        'exercise_db_id': ex.exercise_db_id,
                        'name': ex.name,
                        'target_muscle': ex.target_muscle,
                        'equipment': ex.equipment,
                        'gif_url': ex.gif_url,
                        'difficulty': ex.difficulty,
                    }
                    for ex in cached_exercises
                ], ''

            session.close()

            url = f'{cls.BASE_URL}/exercises/name/{query}'
            response = requests.get(url, headers=cls.get_headers(), timeout=10)

            if response.status_code != 200:
                logger.warning('ExerciseDB API returned status %s for search %s', response.status_code, query)
                return [], GENERIC_ERROR

            exercises = response.json()

            session = SessionLocal()
            for exercise_data in exercises[:limit]:
                existing = session.query(Exercise).filter_by(
                    exercise_db_id=exercise_data.get('id'),
                ).first()

                if not existing:
                    exercise = Exercise(
                        exercise_db_id=exercise_data.get('id'),
                        name=exercise_data.get('name', ''),
                        target_muscle=exercise_data.get('target', '').lower(),
                        equipment=exercise_data.get('equipment', ''),
                        gif_url=exercise_data.get('gifUrl', ''),
                        difficulty='beginner',
                        is_cached=True,
                        synced_at=datetime.now(timezone.utc),
                    )
                    session.add(exercise)

            session.commit()
            session.close()

            return exercises[:limit], ''

        except requests.exceptions.RequestException:
            logger.exception('ExerciseDB connection error for search %s', query)
            return [], GENERIC_ERROR
        except Exception:
            logger.exception('Unexpected error searching exercises for %s', query)
            return [], GENERIC_ERROR

    @classmethod
    def get_all_muscles(cls) -> tuple[list[str], str]:
        try:
            url = f'{cls.BASE_URL}/exercises/targetList'
            response = requests.get(url, headers=cls.get_headers(), timeout=10)

            if response.status_code != 200:
                logger.warning('ExerciseDB API returned status %s for targetList', response.status_code)
                return [], GENERIC_ERROR

            muscles = response.json()
            return sorted(muscles), ''

        except requests.exceptions.RequestException:
            logger.exception('ExerciseDB connection error for targetList')
            return [], GENERIC_ERROR
        except Exception:
            logger.exception('Unexpected error fetching muscle list')
            return [], GENERIC_ERROR

    @classmethod
    def get_exercise_by_id(cls, exercise_id: str) -> tuple[dict | None, str]:
        try:
            session = SessionLocal()
            exercise = session.query(Exercise).filter_by(exercise_db_id=exercise_id).first()

            if exercise:
                result = {
                    'id': exercise.id,
                    'exercise_db_id': exercise.exercise_db_id,
                    'name': exercise.name,
                    'target_muscle': exercise.target_muscle,
                    'equipment': exercise.equipment,
                    'gif_url': exercise.gif_url,
                    'difficulty': exercise.difficulty,
                }
                session.close()
                return result, ''

            session.close()

            url = f'{cls.BASE_URL}/exercises/exercise/{exercise_id}'
            response = requests.get(url, headers=cls.get_headers(), timeout=10)

            if response.status_code != 200:
                return None, 'Ejercicio no encontrado'

            exercise_data = response.json()

            session = SessionLocal()
            exercise = Exercise(
                exercise_db_id=exercise_data.get('id'),
                name=exercise_data.get('name', ''),
                target_muscle=exercise_data.get('target', '').lower(),
                equipment=exercise_data.get('equipment', ''),
                gif_url=exercise_data.get('gifUrl', ''),
                difficulty='beginner',
                is_cached=True,
                synced_at=datetime.now(timezone.utc),
            )
            session.add(exercise)
            session.commit()
            session.close()

            return exercise_data, ''

        except Exception:
            logger.exception('Unexpected error fetching exercise %s', exercise_id)
            return None, GENERIC_ERROR
