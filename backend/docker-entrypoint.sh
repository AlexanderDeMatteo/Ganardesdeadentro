#!/bin/sh
set -e

echo "FitTrack backend: applying database migrations..."
alembic upgrade head

echo "FitTrack backend: starting server..."
exec python run.py
