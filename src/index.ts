import { Connection, WorkflowClient } from '@temporalio/client';
import type { DeployWorkflowInput } from './workflows/deploy.workflow';
import { DeployWorkflow } from './workflows/deploy.workflow';
import type { PipelineWorkflowInput } from './workflows/pipeline.workflow';
import { PipelineWorkflow } from './workflows/pipeline.workflow';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? '127.0.0.1:7233';

async function createClient() {
  const connection = await Connection.connect({ address: TEMPORAL_ADDRESS });
  return new WorkflowClient({ connection });
}

export async function startDeployExample() {
  const client = await createClient();
  const workflowId = `deploy-${Date.now()}`;
  const input: DeployWorkflowInput = {
    scope: 'svc-a',
    version: '1.2.3',
    env: 'staging',
  };

  const handle = await client.start(DeployWorkflow, {
    args: [input],
    workflowId,
    taskQueue: 'deploy-queue',
  });

  console.log('DeployWorkflow started', {
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId,
  });

  return handle;
}

export async function startPipelineExample() {
  const client = await createClient();
  const workflowId = `pipeline-${Date.now()}`;
  const input: PipelineWorkflowInput = {
    deployments: [
      { scope: 'svc-a', version: '1.0.0', env: 'staging' },
      { scope: 'svc-b', version: '2.0.0', env: 'staging' },
      { scope: 'svc-c', version: '3.0.0', env: 'production' },
    ],
    waves: [
      ['svc-a', 'svc-b'],
      ['svc-c'],
    ],
    failPolicy: 'wait-all',
  };

  const handle = await client.start(PipelineWorkflow, {
    args: [input],
    workflowId,
    taskQueue: 'pipeline-queue',
  });

  console.log('PipelineWorkflow started', {
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId,
  });

  return handle;
}

if (require.main === module) {
  const workflowType = process.argv[2];
  if (workflowType === 'deploy') {
    startDeployExample().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else if (workflowType === 'pipeline') {
    startPipelineExample().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else {
    console.log('Usage: ts-node src/index.ts <deploy|pipeline>');
  }
}
