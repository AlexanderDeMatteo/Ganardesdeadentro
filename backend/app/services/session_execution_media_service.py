import logging
import os
import shutil
import uuid
from pathlib import Path

from werkzeug.datastructures import FileStorage

from app.database import SessionLocal
from app.config import get_config
from app.models import SessionExecutionMedia

logger = logging.getLogger(__name__)
config = get_config()
GENERIC_ERROR = 'No se pudo completar la operación'
ALLOWED_MIMES = {'video/mp4', 'video/webm', 'video/quicktime'}
ALLOWED_EXT = {'mp4', 'webm', 'mov'}


class SessionExecutionMediaService:
    @classmethod
    def _upload_dir(cls) -> Path:
        upload_dir = Path(config.SESSION_EXECUTION_MEDIA_UPLOAD_DIR)
        if not upload_dir.is_absolute():
            upload_dir = (Path.cwd() / upload_dir).resolve()
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir

    @classmethod
    def _resolve_ext(cls, content_type: str, filename: str) -> str | None:
        ext = (filename.rsplit('.', 1)[-1] if '.' in filename else '').lower()
        if ext in ALLOWED_EXT:
            return ext
        if content_type == 'video/webm':
            return 'webm'
        if content_type in ('video/mp4', 'video/quicktime'):
            return 'mp4'
        return None

    @classmethod
    def upload(
        cls,
        file: FileStorage,
        *,
        athlete_id: int,
        uploaded_by_id: int,
    ) -> tuple[dict | None, str, int]:
        if file is None or not file.filename:
            return None, 'Archivo requerido', 400

        content_type = (file.content_type or '').lower()
        ext = cls._resolve_ext(content_type, file.filename or '')
        if ext is None:
            return None, 'Tipo de archivo no permitido', 400

        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > config.SESSION_EXECUTION_MEDIA_MAX_BYTES:
            return None, 'Archivo demasiado grande', 400

        temp_path: Path | None = None
        session = SessionLocal()
        try:
            upload_dir = cls._upload_dir()
            filename = f'exec-{uuid.uuid4().hex}.{ext}'
            dest = upload_dir / filename
            # Guardar en el mismo volumen que dest (evita OSError cross-device en Docker: /tmp → /data).
            temp_path = upload_dir / f'.tmp-{uuid.uuid4().hex}.{ext}'
            file.save(temp_path)
            shutil.move(str(temp_path), dest)
            temp_path = None

            media_record = SessionExecutionMedia(
                filename=filename,
                athlete_id=athlete_id,
                uploaded_by_id=uploaded_by_id,
            )
            session.add(media_record)
            session.commit()

            return {
                'url': f'/api/sessions/execution-media/{filename}',
                'uploadedAt': None,
            }, '', 201
        except Exception:
            session.rollback()
            logger.exception('Error uploading session execution media')
            return None, GENERIC_ERROR, 500
        finally:
            session.close()
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)

    @classmethod
    def resolve_media_path(cls, filename: str) -> Path | None:
        if not filename or '/' in filename or '\\' in filename or '..' in filename:
            return None
        path = cls._upload_dir() / filename
        if not path.is_file():
            return None
        return path

    @classmethod
    def get_media_owner_athlete_id(cls, filename: str) -> int | None:
        if not filename:
            return None
        session = SessionLocal()
        try:
            record = session.query(SessionExecutionMedia).filter_by(filename=filename).first()
            if record is None:
                return None
            return int(record.athlete_id)
        finally:
            session.close()
