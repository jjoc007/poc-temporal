#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
npx ts-node -e "import { startDeployExample } from './src/index'; startDeployExample().then((handle: any) => { console.log(JSON.stringify({ workflowId: handle.workflowId, runId: handle.firstExecutionRunId }, null, 2)); }).catch((err: any) => { console.error(err); process.exit(1); });"
