#!/usr/bin/env bash
set -euo pipefail

node -e "require('ts-node/register'); const { startPipelineExample } = require('../src/index'); startPipelineExample().then((handle) => { console.log(JSON.stringify({ workflowId: handle.workflowId, runId: handle.firstExecutionRunId }, null, 2)); }).catch((err) => { console.error(err); process.exit(1); });"
