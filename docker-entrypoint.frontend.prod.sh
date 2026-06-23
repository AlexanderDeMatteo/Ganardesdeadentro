#!/bin/sh
set -e

export CI=true
export NODE_ENV=production

echo "Building Next.js production bundle..."
pnpm exec next build

echo "Starting Next.js production server..."
exec pnpm exec next start -H 0.0.0.0 -p 3000
