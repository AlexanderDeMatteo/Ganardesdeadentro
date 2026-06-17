#!/bin/sh
set -e

export CI=true

STAMP=node_modules/.install-stamp
if [ ! -x node_modules/.bin/next ] || [ ! -f "$STAMP" ] || [ pnpm-lock.yaml -nt "$STAMP" ] || [ package.json -nt "$STAMP" ]; then
  echo "Installing frontend dependencies..."
  pnpm install --frozen-lockfile --ignore-scripts
  touch "$STAMP"
fi

exec pnpm exec next dev -H 0.0.0.0
