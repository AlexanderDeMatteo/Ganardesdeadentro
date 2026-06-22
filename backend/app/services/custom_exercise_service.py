import json
import logging
import os
import re
import shutil
import tempfile
import uuid
from pathlib import Path

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.config import get_config
from app.database import SessionLocal
from app.models import DifficultyEnum, Exercise, RoutineExercise
from app.services.exercise_api_service import ExerciseAPIService
from app.services.video_processor import VideoProcessor, VideoProcessorError
from app.utils.exercise_serializer import serialize_exercise

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'

config = get_config()

MIME_TO_EXT = {
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'image/webp': 'webp',
}

EXT_TO_ANIMATION_TYPE = {
    'gif': 'gif',
    'webp': 'gif',
    'mp4': 'video',
}


class CustomExerciseService:
    @staticmethod
    def _ensure_upload_dir() -> Path:
        upload_dir = Path(config.EXERCISE_MEDIA_UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir

    @staticmethod
    def _load_aliases() -> dict[str, str]:
        aliases_path = Path(__file__).resolve().parent.parent / 'data' / 'exercise_name_aliases.json'
        try:
            with aliases_path.open(encoding='utf-8') as handle:
                data = json.load(handle)
            return {str(k).lower().strip(): str(v).lower().strip() for k, v in data.items()}
        except (OSError, json.JSONDecodeError):
            logger.warning('No se pudo cargar exercise_name_aliases.json')
            return {}

    @staticmethod
    def _normalize_difficulty(value: str | None) -> DifficultyEnum:
        if not value:
            return DifficultyEnum.BEGINNER
        normalized = value.lower().strip()
        if normalized == 'intermediate':
            return DifficultyEnum.INTERMEDIATE
        if normalized == 'expert':
            return DifficultyEnum.EXPERT
        return DifficultyEnum.BEGINNER

    @staticmethod
    def _get_by_external_id(session, exercise_id: str) -> Exercise | None:
        return session.query(Exercise).filter_by(exercise_db_id=exercise_id).first()

    @staticmethod
    def _search_terms(name: str) -> list[str]:
        normalized = name.lower().strip()
        aliases = CustomExerciseService._load_aliases()
        terms = [normalized]
        if normalized in aliases:
            terms.append(aliases[normalized])
        for alias, english in aliases.items():
            if alias in normalized and english not in terms:
                terms.append(english)
        return terms

    @staticmethod
    def _score_match(query: str, candidate_name: str) -> int:
        query_norm = query.lower().strip()
        candidate_norm = candidate_name.lower().strip()
        if query_norm == candidate_norm:
            return 100
        if query_norm in candidate_norm or candidate_norm in query_norm:
            return 75
        query_tokens = set(re.findall(r'[a-z0-9]+', query_norm))
        candidate_tokens = set(re.findall(r'[a-z0-9]+', candidate_norm))
        if query_tokens and query_tokens.issubset(candidate_tokens):
            return 60
        return 0

    @staticmethod
    def _pick_best_match(query: str, results: list[dict]) -> dict | None:
        best: dict | None = None
        best_score = 0
        for item in results:
            name = item.get('name') or ''
            score = CustomExerciseService._score_match(query, name)
            if score > best_score:
                best_score = score
                best = item
        if best_score > 0:
            return best
        return results[0] if results else None

    @staticmethod
    def _apply_exercisedb_animation(exercise: Exercise, match: dict) -> None:
        gif_url = match.get('gifUrl') or match.get('gif_url') or ''
        if not gif_url:
            return
        exercise.gif_url = gif_url
        exercise.animation_url = gif_url
        exercise.animation_type = 'gif'
        exercise.animation_source = 'exercisedb'

    @classmethod
    def match_animation(cls, exercise_id: str) -> tuple[dict | None, str, int]:
        session = SessionLocal()
        try:
            exercise = cls._get_by_external_id(session, exercise_id)
            if exercise is None or not exercise.is_active:
                return None, 'Ejercicio no encontrado', 404
            if not exercise.is_custom:
                return None, 'Solo ejercicios custom admiten match de animación', 400

            best_match: dict | None = None
            for term in cls._search_terms(exercise.name):
                results, error = ExerciseAPIService.search_exercises(term, limit=10)
                if error or not results:
                    continue
                best_match = cls._pick_best_match(term, results)
                if best_match and (best_match.get('gifUrl') or best_match.get('gif_url')):
                    break

            if best_match:
                cls._apply_exercisedb_animation(exercise, best_match)
            else:
                exercise.animation_type = 'none'
                exercise.animation_source = 'none'
                exercise.animation_url = None
                exercise.gif_url = None

            session.commit()
            session.refresh(exercise)
            return serialize_exercise(exercise), '', 200
        except Exception:
            session.rollback()
            logger.exception('Error matching animation for exercise %s', exercise_id)
            return None, GENERIC_ERROR, 500
        finally:
            session.close()

    @classmethod
    def create_exercise(cls, creator_id: int, payload: dict) -> tuple[dict | None, str, int]:
        session = SessionLocal()
        try:
            name = payload['name'].strip()
            duplicate = (
                session.query(Exercise)
                .filter(
                    Exercise.is_custom.is_(True),
                    Exercise.is_active.is_(True),
                    Exercise.name.ilike(name),
                )
                .first()
            )
            if duplicate:
                return None, 'Ya existe un ejercicio custom con ese nombre', 409

            exercise_db_id = f'custom-{uuid.uuid4()}'
            exercise = Exercise(
                exercise_db_id=exercise_db_id,
                name=name,
                target_muscle=payload['target_muscle'].lower().strip(),
                equipment=(payload.get('equipment') or 'body weight').strip(),
                description=payload.get('description'),
                difficulty=cls._normalize_difficulty(payload.get('difficulty')),
                is_cached=False,
                is_custom=True,
                is_active=True,
                created_by_id=creator_id,
                animation_type='none',
                animation_source='none',
            )
            session.add(exercise)
            session.commit()
            session.refresh(exercise)

            result, error, status = cls.match_animation(exercise_db_id)
            if error and status >= 500:
                return serialize_exercise(exercise), '', 201
            return result or serialize_exercise(exercise), '', 201
        except Exception:
            session.rollback()
            logger.exception('Error creating custom exercise')
            return None, GENERIC_ERROR, 500
        finally:
            session.close()

    @classmethod
    def update_exercise(cls, exercise_id: str, payload: dict) -> tuple[dict | None, str, int]:
        session = SessionLocal()
        try:
            exercise = cls._get_by_external_id(session, exercise_id)
            if exercise is None or not exercise.is_active:
                return None, 'Ejercicio no encontrado', 404
            if not exercise.is_custom:
                return None, 'Solo ejercicios custom pueden editarse', 400

            if 'name' in payload and payload['name']:
                name = payload['name'].strip()
                duplicate = (
                    session.query(Exercise)
                    .filter(
                        Exercise.is_custom.is_(True),
                        Exercise.is_active.is_(True),
                        Exercise.name.ilike(name),
                        Exercise.id != exercise.id,
                    )
                    .first()
                )
                if duplicate:
                    return None, 'Ya existe un ejercicio custom con ese nombre', 409
                exercise.name = name

            if 'target_muscle' in payload and payload['target_muscle']:
                exercise.target_muscle = payload['target_muscle'].lower().strip()
            if 'equipment' in payload:
                exercise.equipment = (payload.get('equipment') or 'body weight').strip()
            if 'description' in payload:
                exercise.description = payload.get('description')
            if 'difficulty' in payload and payload['difficulty']:
                exercise.difficulty = cls._normalize_difficulty(payload['difficulty'])

            session.commit()
            session.refresh(exercise)
            return serialize_exercise(exercise), '', 200
        except Exception:
            session.rollback()
            logger.exception('Error updating exercise %s', exercise_id)
            return None, GENERIC_ERROR, 500
        finally:
            session.close()

    @staticmethod
    def _resolve_upload_ext(content_type: str, filename: str) -> tuple[str | None, str]:
        ext = MIME_TO_EXT.get(content_type)
        if not ext and '.' in filename:
            guessed_ext = filename.rsplit('.', 1)[-1].lower()
            ext = guessed_ext if guessed_ext in EXT_TO_ANIMATION_TYPE else None
            if ext == 'gif':
                content_type = 'image/gif'
            elif ext == 'mp4':
                content_type = 'video/mp4'
            elif ext == 'webp':
                content_type = 'image/webp'
        return ext, content_type

    @staticmethod
    def _apply_media_to_exercise(exercise: Exercise, filename: str, ext: str) -> None:
        media_path = f'/api/exercises/media/{filename}'
        animation_type = EXT_TO_ANIMATION_TYPE.get(ext, 'none')
        exercise.animation_url = media_path
        exercise.animation_type = animation_type
        exercise.animation_source = 'upload'
        if animation_type == 'gif':
            exercise.gif_url = media_path
        else:
            exercise.gif_url = None

    @classmethod
    def _prepare_media_file(
        cls,
        source_path: Path,
        destination: Path,
        ext: str,
    ) -> tuple[Path | None, str, int]:
        try:
            if ext == 'mp4' and VideoProcessor.is_video_path(source_path):
                VideoProcessor.process(source_path, destination)
                return destination, '', 200

            if source_path.stat().st_size > config.EXERCISE_MEDIA_MAX_BYTES:
                return None, 'Archivo demasiado grande', 400

            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, destination)
            return destination, '', 200
        except VideoProcessorError as exc:
            return None, exc.message, 400

    @classmethod
    def persist_exercise_media(
        cls,
        exercise: Exercise,
        source_path: Path,
        ext: str,
        *,
        session=None,
        commit: bool = True,
    ) -> tuple[dict | None, str, int]:
        upload_dir = cls._ensure_upload_dir()
        filename = secure_filename(f'{exercise.exercise_db_id}.{ext}')
        destination = upload_dir / filename

        prepared, error, status = cls._prepare_media_file(source_path, destination, ext)
        if error:
            return None, error, status

        cls._apply_media_to_exercise(exercise, filename, ext)

        if session is not None and commit:
            session.commit()
            session.refresh(exercise)

        return serialize_exercise(exercise), '', 200

    @classmethod
    def ingest_media_from_path(
        cls,
        exercise_id: str,
        source_path: Path,
        *,
        dry_run: bool = False,
    ) -> tuple[dict | None, str, int]:
        if not source_path.is_file():
            return None, 'Archivo no encontrado', 400

        ext = source_path.suffix.lstrip('.').lower()
        if ext not in EXT_TO_ANIMATION_TYPE:
            return None, 'Tipo de archivo no permitido', 400

        session = SessionLocal()
        try:
            exercise = cls._get_by_external_id(session, exercise_id)
            if exercise is None or not exercise.is_active:
                return None, 'Ejercicio no encontrado', 404
            if not exercise.is_custom:
                return None, 'Solo ejercicios custom admiten subida de media', 400

            if dry_run:
                if ext == 'mp4':
                    metadata = VideoProcessor.probe(source_path)
                    max_duration = config.EXERCISE_MEDIA_MAX_DURATION_SECONDS
                    if metadata.duration_seconds > max_duration:
                        return None, f'El video no puede superar {max_duration} segundos', 400
                return {
                    'exercise_db_id': exercise.exercise_db_id,
                    'name': exercise.name,
                    'source': str(source_path),
                    'dry_run': True,
                }, '', 200

            result, error, status = cls.persist_exercise_media(
                exercise,
                source_path,
                ext,
                session=session,
            )
            if error:
                session.rollback()
                return None, error, status
            return result, '', status
        except VideoProcessorError as exc:
            session.rollback()
            return None, exc.message, 400
        except Exception:
            session.rollback()
            logger.exception('Error ingesting media for exercise %s', exercise_id)
            return None, GENERIC_ERROR, 500
        finally:
            session.close()

    @classmethod
    def delete_exercise(cls, exercise_id: str) -> tuple[dict | None, str, int]:
        session = SessionLocal()
        try:
            exercise = cls._get_by_external_id(session, exercise_id)
            if exercise is None:
                return None, 'Ejercicio no encontrado', 404
            if not exercise.is_custom:
                return None, 'Solo ejercicios custom pueden eliminarse', 400

            in_use = (
                session.query(RoutineExercise)
                .filter_by(exercise_id=exercise.id)
                .count()
            )
            if in_use > 0:
                exercise.is_active = False
                session.commit()
                return {'message': 'Ejercicio desactivado porque está en uso en rutinas'}, '', 200

            session.delete(exercise)
            session.commit()
            return {'message': 'Ejercicio eliminado'}, '', 200
        except Exception:
            session.rollback()
            logger.exception('Error deleting exercise %s', exercise_id)
            return None, GENERIC_ERROR, 500
        finally:
            session.close()

    @classmethod
    def upload_media(cls, exercise_id: str, file: FileStorage) -> tuple[dict | None, str, int]:
        if file is None or not file.filename:
            return None, 'Archivo requerido', 400

        allowed_mimes = {
            mime.strip()
            for mime in config.EXERCISE_MEDIA_ALLOWED_MIME.split(',')
            if mime.strip()
        }
        content_type = (file.content_type or '').lower()
        filename = file.filename or ''
        ext, content_type = cls._resolve_upload_ext(content_type, filename)

        if content_type not in allowed_mimes and ext not in {'gif', 'mp4', 'webp'}:
            return None, 'Tipo de archivo no permitido', 400
        if not ext:
            return None, 'Tipo de archivo no permitido', 400

        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        max_upload = (
            config.EXERCISE_MEDIA_RAW_MAX_BYTES
            if ext == 'mp4'
            else config.EXERCISE_MEDIA_MAX_BYTES
        )
        if size > max_upload:
            return None, 'Archivo demasiado grande', 400

        session = SessionLocal()
        temp_path: Path | None = None
        try:
            exercise = cls._get_by_external_id(session, exercise_id)
            if exercise is None or not exercise.is_active:
                return None, 'Ejercicio no encontrado', 404
            if not exercise.is_custom:
                return None, 'Solo ejercicios custom admiten subida de media', 400

            suffix = f'.{ext}'
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                file.save(temp_file.name)
                temp_path = Path(temp_file.name)

            result, error, status = cls.persist_exercise_media(
                exercise,
                temp_path,
                ext,
                session=session,
            )
            if error:
                session.rollback()
                return None, error, status
            return result, '', status
        except Exception:
            session.rollback()
            logger.exception('Error uploading media for exercise %s', exercise_id)
            return None, GENERIC_ERROR, 500
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)
            session.close()

    @staticmethod
    def list_exercises(
        *,
        muscle: str | None = None,
        page: int = 1,
        per_page: int = 20,
        custom_only: bool = False,
        source: str = 'all',
        q: str | None = None,
        requester_id: int | None = None,
        requester_role: str | None = None,
    ) -> dict:
        session = SessionLocal()
        try:
            query = session.query(Exercise).filter(Exercise.is_active.is_(True))

            effective_source = source
            if custom_only:
                effective_source = 'custom'

            if effective_source == 'catalog':
                query = query.filter(Exercise.is_cached.is_(True), Exercise.is_custom.is_(False))
            elif effective_source == 'custom':
                query = query.filter(Exercise.is_custom.is_(True))
                if requester_role == 'trainer' and requester_id is not None:
                    query = query.filter(Exercise.created_by_id == requester_id)
            else:
                query = query.filter(
                    (Exercise.is_cached.is_(True)) | (Exercise.is_custom.is_(True)),
                )

            if muscle:
                query = query.filter(Exercise.target_muscle == muscle.lower())
            if q:
                query = query.filter(Exercise.name.ilike(f'%{q.strip()}%'))

            total = query.count()
            exercises = (
                query.order_by(Exercise.name.asc())
                .limit(per_page)
                .offset((page - 1) * per_page)
                .all()
            )
            return {
                'exercises': [serialize_exercise(ex) for ex in exercises],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page if per_page else 0,
                },
            }
        finally:
            session.close()

    @staticmethod
    def get_media_path(filename: str) -> Path | None:
        safe_name = secure_filename(filename)
        if not safe_name or safe_name != filename:
            return None
        upload_dir = Path(config.EXERCISE_MEDIA_UPLOAD_DIR)
        candidate = upload_dir / safe_name
        if not candidate.is_file():
            return None
        return candidate.resolve()

    @staticmethod
    def get_exercise_record(exercise_id: str) -> tuple[dict | None, str, int]:
        session = SessionLocal()
        try:
            exercise = session.query(Exercise).filter_by(exercise_db_id=exercise_id).first()
            if exercise is None or not exercise.is_active:
                return None, 'Ejercicio no encontrado', 404
            return serialize_exercise(exercise), '', 200
        finally:
            session.close()
