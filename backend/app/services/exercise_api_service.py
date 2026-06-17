import logging
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

import certifi
import requests
import urllib3
from requests import Response

from app.config import get_config
from app.database import SessionLocal
from app.models import Exercise
from app.utils.exercise_serializer import serialize_exercise

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'

config = get_config()


class ExerciseAPIService:
    """Integración con ExerciseDB V1 (API gratuita en oss.exercisedb.dev)."""

    BASE_URL = config.EXERCISEDB_API_URL.rstrip('/')
    API_KEY = config.EXERCISEDB_API_KEY
    API_HOST = config.EXERCISEDB_API_HOST

    @classmethod
    def get_headers(cls) -> dict:
        headers = {'Accept': 'application/json'}
        if cls.API_KEY and cls.API_HOST:
            headers['x-rapidapi-key'] = cls.API_KEY
            headers['x-rapidapi-host'] = cls.API_HOST
        return headers

    @classmethod
    def _ssl_verify(cls):
        if config.EXERCISEDB_SSL_VERIFY:
            return certifi.where()
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        return False

    @classmethod
    def _api_get(cls, path: str, params: dict | None = None) -> dict:
        query = f'?{urlencode(params)}' if params else ''
        url = f'{cls.BASE_URL}{path}{query}'
        response: Response = requests.get(
            url,
            headers=cls.get_headers(),
            timeout=20,
            verify=cls._ssl_verify(),
        )
        if response.status_code != 200:
            logger.warning('ExerciseDB API %s returned status %s', path, response.status_code)
            raise requests.HTTPError(f'status {response.status_code}', response=response)
        payload = response.json()
        if not payload.get('success', True) and 'data' not in payload:
            raise ValueError('invalid API payload')
        return payload

    @staticmethod
    def _first_or_empty(values: list | None, fallback: str = '') -> str:
        if values and len(values) > 0 and values[0]:
            return str(values[0])
        return fallback

    @classmethod
    def _normalize_v1_exercise(cls, data: dict, *, default_muscle: str = '') -> dict:
        exercise_id = data.get('exerciseId') or data.get('id') or ''
        target_muscle = cls._first_or_empty(
            data.get('targetMuscles'),
            default_muscle or cls._first_or_empty(data.get('bodyParts'), 'general'),
        )
        equipment = cls._first_or_empty(data.get('equipments'), 'body weight')
        return {
            'id': exercise_id,
            'exercise_db_id': exercise_id,
            'name': data.get('name', ''),
            'target': target_muscle.lower().strip(),
            'equipment': equipment,
            'gifUrl': data.get('gifUrl', ''),
        }

    @classmethod
    def _persist_v1_items(
        cls,
        items: list[dict],
        *,
        default_muscle: str = '',
    ) -> list[Exercise]:
        session = SessionLocal()
        persisted: list[Exercise] = []
        try:
            for raw in items:
                normalized = cls._normalize_v1_exercise(raw, default_muscle=default_muscle)
                exercise_id = normalized.get('exercise_db_id')
                if not exercise_id:
                    continue
                existing = session.query(Exercise).filter_by(exercise_db_id=exercise_id).first()
                if existing:
                    if normalized.get('gifUrl') and not existing.gif_url:
                        existing.gif_url = normalized['gifUrl']
                    persisted.append(existing)
                    continue
                exercise = Exercise(
                    exercise_db_id=exercise_id,
                    name=normalized.get('name', ''),
                    target_muscle=normalized.get('target', default_muscle or 'general'),
                    equipment=normalized.get('equipment', 'body weight'),
                    gif_url=normalized.get('gifUrl', ''),
                    difficulty='beginner',
                    is_cached=True,
                    synced_at=datetime.now(timezone.utc),
                )
                session.add(exercise)
                persisted.append(exercise)
            session.commit()
            for exercise in persisted:
                session.refresh(exercise)
            return persisted
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @classmethod
    def _fetch_exercises_by_muscle_remote(
        cls,
        muscle: str,
        *,
        limit: int = 50,
    ) -> list[dict]:
        collected: list[dict] = []
        cursor: str | None = None
        page_limit = min(max(limit, 1), 100)

        while len(collected) < limit:
            params: dict[str, Any] = {
                'targetMuscles': muscle,
                'limit': page_limit,
            }
            if cursor:
                params['cursor'] = cursor
            payload = cls._api_get('/api/v1/exercises/muscles', params)
            batch = payload.get('data') or []
            if not batch:
                break
            collected.extend(batch)
            meta = payload.get('meta') or {}
            if not meta.get('hasNextPage') or not meta.get('nextCursor'):
                break
            cursor = meta.get('nextCursor')
            if len(collected) >= limit:
                break

        return collected[:limit]

    @classmethod
    def get_exercises_by_muscle(
        cls,
        muscle: str,
        limit: int = 50,
        *,
        force_refresh: bool = False,
    ) -> tuple[list[dict], str]:
        muscle_key = muscle.lower().strip()
        try:
            session = SessionLocal()
            if not force_refresh:
                cached_exercises = (
                    session.query(Exercise)
                    .filter_by(target_muscle=muscle_key, is_cached=True)
                    .limit(limit)
                    .all()
                )
                if cached_exercises:
                    session.close()
                    return [serialize_exercise(ex) for ex in cached_exercises], ''
            session.close()

            remote_items = cls._fetch_exercises_by_muscle_remote(muscle_key, limit=limit)
            persisted = cls._persist_v1_items(remote_items, default_muscle=muscle_key)
            return [serialize_exercise(ex) for ex in persisted], ''

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
            cached_exercises = (
                session.query(Exercise)
                .filter(Exercise.name.ilike(f'%{query}%'))
                .limit(limit)
                .all()
            )
            if cached_exercises:
                session.close()
                return [serialize_exercise(ex) for ex in cached_exercises], ''
            session.close()

            payload = cls._api_get('/api/v1/exercises/search', {'search': query})
            remote_items = (payload.get('data') or [])[:limit]
            persisted = cls._persist_v1_items(remote_items)
            return [serialize_exercise(ex) for ex in persisted], ''

        except requests.exceptions.RequestException:
            logger.exception('ExerciseDB connection error for search %s', query)
            return [], GENERIC_ERROR
        except Exception:
            logger.exception('Unexpected error searching exercises for %s', query)
            return [], GENERIC_ERROR

    @classmethod
    def get_catalog_muscles(cls) -> list[str]:
        """Músculos con al menos un ejercicio de catálogo en caché local."""
        session = SessionLocal()
        try:
            rows = (
                session.query(Exercise.target_muscle)
                .filter(
                    Exercise.is_cached.is_(True),
                    Exercise.is_custom.is_(False),
                    Exercise.is_active.is_(True),
                )
                .distinct()
                .order_by(Exercise.target_muscle.asc())
                .all()
            )
            return [row[0] for row in rows if row[0]]
        finally:
            session.close()

    @classmethod
    def get_all_muscles(cls) -> tuple[list[str], str]:
        try:
            payload = cls._api_get('/api/v1/muscles')
            muscles = [
                str(item.get('name', '')).strip()
                for item in (payload.get('data') or [])
                if item.get('name')
            ]
            return sorted(set(muscles)), ''

        except requests.exceptions.RequestException:
            logger.exception('ExerciseDB connection error for muscles list')
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
                if not exercise.is_active:
                    session.close()
                    return None, 'Ejercicio no encontrado'
                result = serialize_exercise(exercise)
                session.close()
                return result, ''

            session.close()

            payload = cls._api_get(f'/api/v1/exercises/{exercise_id}')
            exercise_data = payload.get('data')
            if not exercise_data:
                return None, 'Ejercicio no encontrado'

            persisted = cls._persist_v1_items([exercise_data])
            if not persisted:
                return None, 'Ejercicio no encontrado'
            return serialize_exercise(persisted[0]), ''

        except requests.exceptions.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 404:
                return None, 'Ejercicio no encontrado'
            logger.exception('ExerciseDB HTTP error fetching exercise %s', exercise_id)
            return None, GENERIC_ERROR
        except Exception:
            logger.exception('Unexpected error fetching exercise %s', exercise_id)
            return None, GENERIC_ERROR

    @classmethod
    def sync_catalog(cls, *, limit_per_muscle: int = 100, pause_seconds: float = 0.3) -> tuple[dict, str, int]:
        muscles, error = cls.get_all_muscles()
        if error:
            return {}, error, 500

        session = SessionLocal()
        try:
            before_count = session.query(Exercise).filter_by(is_cached=True).count()
        finally:
            session.close()

        synced_muscles: list[str] = []
        errors: list[dict] = []

        for muscle in muscles:
            _, muscle_error = cls.get_exercises_by_muscle(
                muscle,
                limit=limit_per_muscle,
                force_refresh=True,
            )
            if muscle_error:
                errors.append({'muscle': muscle, 'error': muscle_error})
            else:
                synced_muscles.append(muscle)
            if pause_seconds > 0:
                time.sleep(pause_seconds)

        session = SessionLocal()
        try:
            after_count = session.query(Exercise).filter_by(is_cached=True).count()
        finally:
            session.close()

        payload = {
            'synced_muscles': len(synced_muscles),
            'muscles': synced_muscles,
            'total_cached': after_count,
            'added': max(0, after_count - before_count),
            'errors': errors or None,
        }
        return payload, '', 200
