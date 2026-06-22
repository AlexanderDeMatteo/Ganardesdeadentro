#!/usr/bin/env python
"""Ingesta masiva de videos/GIFs de ejercicios custom usando VideoProcessor."""
from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('ENVIRONMENT', 'development')

from app import create_app
from app.database import SessionLocal, init_db
from app.models import Exercise
from app.services.custom_exercise_service import CustomExerciseService

SUPPORTED_EXTENSIONS = {'.mp4', '.gif', '.webp'}


def _slugify(value: str) -> str:
    normalized = value.lower().strip()
    normalized = re.sub(r'[^a-z0-9]+', '-', normalized)
    return normalized.strip('-')


def _load_csv_mapping(csv_path: Path) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    with csv_path.open(encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError('CSV vacío o sin encabezados')
        for row in reader:
            exercise_id = (row.get('exercise_db_id') or row.get('id') or '').strip()
            filename = (row.get('filename') or row.get('file') or '').strip()
            if exercise_id and filename:
                rows.append((exercise_id, filename))
    return rows


def _resolve_by_name(session, stem: str) -> Exercise | None:
    slug = _slugify(stem)
    exercises = (
        session.query(Exercise)
        .filter(Exercise.is_custom.is_(True), Exercise.is_active.is_(True))
        .all()
    )
    for exercise in exercises:
        if _slugify(exercise.name) == slug:
            return exercise
    for exercise in exercises:
        if slug in _slugify(exercise.name) or _slugify(exercise.name) in slug:
            return exercise
    return None


def _build_jobs(
    session,
    media_dir: Path,
    *,
    csv_path: Path | None,
    match_by: str | None,
) -> list[tuple[str, Path]]:
    jobs: list[tuple[str, Path]] = []

    if csv_path is not None:
        for exercise_id, filename in _load_csv_mapping(csv_path):
            source = media_dir / filename
            jobs.append((exercise_id, source))
        return jobs

    if match_by == 'name':
        for source in sorted(media_dir.iterdir()):
            if not source.is_file() or source.suffix.lower() not in SUPPORTED_EXTENSIONS:
                continue
            exercise = _resolve_by_name(session, source.stem)
            if exercise is None:
                continue
            jobs.append((exercise.exercise_db_id, source))
        return jobs

    raise ValueError('Debes indicar --csv o --match-by name')


def main() -> int:
    parser = argparse.ArgumentParser(description='Ingesta masiva de media de ejercicios')
    parser.add_argument('--dir', required=True, help='Directorio con archivos de media')
    parser.add_argument('--csv', help='CSV con columnas exercise_db_id,filename')
    parser.add_argument(
        '--match-by',
        choices=['name'],
        help='Emparejar archivos por nombre de ejercicio (slug)',
    )
    parser.add_argument('--dry-run', action='store_true', help='Validar sin persistir')
    args = parser.parse_args()

    media_dir = Path(args.dir).resolve()
    if not media_dir.is_dir():
        print(f'Directorio no encontrado: {media_dir}', file=sys.stderr)
        return 1

    if not args.csv and not args.match_by:
        print('Indica --csv mapping.csv o --match-by name', file=sys.stderr)
        return 1

    app = create_app()
    with app.app_context():
        init_db()
        session = SessionLocal()
        try:
            jobs = _build_jobs(
                session,
                media_dir,
                csv_path=Path(args.csv).resolve() if args.csv else None,
                match_by=args.match_by,
            )
        finally:
            session.close()

        if not jobs:
            print('No se encontraron archivos para procesar')
            return 1

        ok = 0
        failed = 0
        for exercise_id, source_path in jobs:
            label = f'{exercise_id} <- {source_path.name}'
            result, error, status = CustomExerciseService.ingest_media_from_path(
                exercise_id,
                source_path,
                dry_run=args.dry_run,
            )
            if error:
                failed += 1
                print(f'ERROR [{status}] {label}: {error}')
                continue
            ok += 1
            if args.dry_run:
                print(f'DRY-RUN OK {label}')
            else:
                animation_url = (result or {}).get('animation_url', '')
                print(f'OK {label} -> {animation_url}')

        print(f'\nResumen: {ok} ok, {failed} error(es), {len(jobs)} total')
        return 0 if failed == 0 else 2


if __name__ == '__main__':
    raise SystemExit(main())
