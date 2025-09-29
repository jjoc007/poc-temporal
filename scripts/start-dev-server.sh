#!/usr/bin/env bash
set -euo pipefail

if command -v temporal >/dev/null 2>&1; then
  echo "Starting Temporal dev server using temporal CLI..."
  exec temporal server start-dev \
    --ip 127.0.0.1 \
    --db-filename temporal.db \
    --dynamic-config-value frontend.enableUpdateWorkflowExecution=true
else
  echo "Temporal CLI not found. Falling back to docker compose."
  exec docker compose up -d
fi
