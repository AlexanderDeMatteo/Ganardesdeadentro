#!/bin/sh
set -e

echo "FitTrack backend: applying database migrations..."
alembic upgrade head

echo "FitTrack backend: starting server..."
if [ "${ENVIRONMENT}" = "production" ] || [ "${FLASK_ENV}" = "production" ]; then
  export FLASK_ENV=production
  export ENVIRONMENT=production
  exec gunicorn \
    --bind "0.0.0.0:${FLASK_PORT:-5000}" \
    --workers "${GUNICORN_WORKERS:-1}" \
    --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
    --timeout "${GUNICORN_TIMEOUT:-120}" \
    run:app
fi

exec python run.py
