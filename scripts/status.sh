#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: npm run status -- <workflowId>"
  exit 1
fi

if ! command -v temporal >/dev/null 2>&1; then
  echo "Temporal CLI is required to query workflow status. Please install it from https://temporal.io/downloads."
  exit 1
fi

WORKFLOW_ID=$1

if [ "${WATCH:-}" = "1" ]; then
  temporal workflow observe --workflow-id "$WORKFLOW_ID"
else
  temporal workflow show --workflow-id "$WORKFLOW_ID"
fi
