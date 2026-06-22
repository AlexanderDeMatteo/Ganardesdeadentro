"""Transcodificación y validación de videos de ejercicios vía ffmpeg/ffprobe."""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

from app.config import get_config

logger = logging.getLogger(__name__)

config = get_config()


class VideoProcessorError(Exception):
    """Error de procesamiento con mensaje seguro para el cliente."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


@dataclass
class VideoMetadata:
    duration_seconds: float
    width: int
    height: int
    size_bytes: int


@dataclass
class ProcessResult:
    output_path: Path
    duration_seconds: float
    width: int
    height: int
    size_bytes: int
    was_transcoded: bool
    # Extension points for future variants / thumbnails:
    # variants: dict[str, Path] | None = None
    # thumbnail_path: Path | None = None


class VideoProcessor:
    @staticmethod
    def is_video_path(path: Path) -> bool:
        return path.suffix.lower() == '.mp4'

    @staticmethod
    def _run_command(args: list[str]) -> subprocess.CompletedProcess[str]:
        try:
            return subprocess.run(
                args,
                capture_output=True,
                text=True,
                check=True,
            )
        except FileNotFoundError as exc:
            logger.exception('ffmpeg/ffprobe no disponible')
            raise VideoProcessorError('Procesamiento de video no disponible') from exc
        except subprocess.CalledProcessError as exc:
            logger.warning(
                'Comando ffmpeg/ffprobe falló: %s stderr=%s',
                ' '.join(args),
                (exc.stderr or '').strip()[:500],
            )
            raise VideoProcessorError('No se pudo procesar el video') from exc

    @classmethod
    def probe(cls, input_path: Path) -> VideoMetadata:
        if not input_path.is_file():
            raise VideoProcessorError('Archivo de video no encontrado')

        result = cls._run_command([
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height,duration',
            '-show_entries', 'format=duration,size',
            '-of', 'json',
            str(input_path),
        ])
        payload = json.loads(result.stdout or '{}')
        streams = payload.get('streams') or []
        stream = streams[0] if streams else {}
        fmt = payload.get('format') or {}

        duration_raw = stream.get('duration') or fmt.get('duration') or '0'
        try:
            duration_seconds = float(duration_raw)
        except (TypeError, ValueError):
            duration_seconds = 0.0

        width = int(stream.get('width') or 0)
        height = int(stream.get('height') or 0)
        size_bytes = int(fmt.get('size') or input_path.stat().st_size)

        return VideoMetadata(
            duration_seconds=duration_seconds,
            width=width,
            height=height,
            size_bytes=size_bytes,
        )

    @classmethod
    def _transcode(cls, input_path: Path, output_path: Path, crf: int) -> None:
        max_width = config.EXERCISE_MEDIA_VIDEO_MAX_WIDTH
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cls._run_command([
            'ffmpeg',
            '-y',
            '-i', str(input_path),
            '-vf', f"scale='min({max_width},iw)':-2",
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-crf', str(crf),
            '-an',
            '-movflags', '+faststart',
            str(output_path),
        ])

    @classmethod
    def process(cls, input_path: Path, output_path: Path) -> ProcessResult:
        if not cls.is_video_path(input_path):
            raise VideoProcessorError('El archivo no es un video MP4')

        metadata = cls.probe(input_path)
        max_duration = config.EXERCISE_MEDIA_MAX_DURATION_SECONDS
        if metadata.duration_seconds > max_duration:
            raise VideoProcessorError(
                f'El video no puede superar {max_duration} segundos',
            )

        transcode_enabled = config.EXERCISE_MEDIA_TRANSCODE_ENABLED
        was_transcoded = False

        if transcode_enabled:
            base_crf = config.EXERCISE_MEDIA_VIDEO_CRF
            cls._transcode(input_path, output_path, base_crf)
            was_transcoded = True

            final_size = output_path.stat().st_size
            if final_size > config.EXERCISE_MEDIA_MAX_BYTES:
                retry_crf = min(base_crf + 4, 35)
                cls._transcode(input_path, output_path, retry_crf)
                final_size = output_path.stat().st_size

            if final_size > config.EXERCISE_MEDIA_MAX_BYTES:
                output_path.unlink(missing_ok=True)
                raise VideoProcessorError(
                    'El video optimizado sigue siendo demasiado grande; '
                    'acorta la duración o reduce la resolución',
                )
        else:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(input_path, output_path)
            if output_path.stat().st_size > config.EXERCISE_MEDIA_MAX_BYTES:
                output_path.unlink(missing_ok=True)
                raise VideoProcessorError('Archivo demasiado grande')

        result_metadata = cls.probe(output_path)
        return ProcessResult(
            output_path=output_path,
            duration_seconds=result_metadata.duration_seconds,
            width=result_metadata.width,
            height=result_metadata.height,
            size_bytes=result_metadata.size_bytes,
            was_transcoded=was_transcoded,
        )
