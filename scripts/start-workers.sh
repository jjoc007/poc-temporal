#!/usr/bin/env bash
set -euo pipefail

if [ -f package-lock.json ] || [ -d node_modules ]; then
  echo "Using existing node_modules"
else
  echo "Installing dependencies..."
  npm install
fi

# Start deploy worker
npx ts-node src/workers/deploy.worker.ts &
DEPLOY_PID=$!

# Start pipeline worker
npx ts-node src/workers/pipeline.worker.ts &
PIPELINE_PID=$!

trap 'echo "Stopping workers"; kill $DEPLOY_PID $PIPELINE_PID' INT TERM

wait $DEPLOY_PID $PIPELINE_PID
