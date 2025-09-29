import { defineSignal, log, setHandler, startChild, workflowInfo } from '@temporalio/workflow';
import type { DeployWorkflowInput } from './deploy.workflow';
import { DeployWorkflow } from './deploy.workflow';

export interface PipelineWorkflowInput {
  deployments: DeployWorkflowInput[];
  waves: string[][];
  failPolicy?: 'fail-fast' | 'wait-all';
  awaitApproval?: boolean;
}

interface DeploymentSummary {
  scope: string;
  status: 'COMPLETED' | 'FAILED';
  runId?: string;
  error?: string;
}

const approveWaveSignal = defineSignal<[string | undefined]>('approveWave');

export async function PipelineWorkflow(input: PipelineWorkflowInput) {
  const { failPolicy = 'wait-all', awaitApproval = false } = input;
  const approvalQueue: Array<() => void> = [];

  setHandler(approveWaveSignal, (decision) => {
    log.info(`Received approval signal with payload: ${decision ?? 'undefined'}`);
    const next = approvalQueue.shift();
    if (next) {
      next();
    }
  });

  const findDeployment = (scope: string) => {
    const deployment = input.deployments.find((d) => d.scope === scope);
    if (!deployment) {
      throw new Error(`Deployment definition for scope ${scope} not found`);
    }
    return deployment;
  };

  const summaries: DeploymentSummary[] = [];

  for (let waveIndex = 0; waveIndex < input.waves.length; waveIndex += 1) {
    const wave = input.waves[waveIndex];
    log.info(`Starting wave ${waveIndex + 1} with scopes: ${wave.join(', ')}`);

    if (awaitApproval) {
      log.info(`Awaiting approval before launching wave ${waveIndex + 1}`);
      await new Promise<void>((resolve) => {
        approvalQueue.push(resolve);
      });
      log.info(`Approval received for wave ${waveIndex + 1}`);
    }

    const childHandles = await Promise.all(
      wave.map((scope) =>
        startChild(DeployWorkflow, {
          args: [findDeployment(scope)],
          workflowId: `${workflowInfo().workflowId}:${scope}:wave${waveIndex + 1}`,
          taskQueue: 'deploy-queue',
          searchAttributes: {
            ParentWorkflowId: workflowInfo().workflowId,
          },
        })
      )
    );

    const waveResults = await Promise.all(
      childHandles.map(async (handle) => {
        try {
          const result = await handle.result();
          summaries.push({ scope: result.scope, status: 'COMPLETED', runId: handle.runId });
          return { status: 'COMPLETED' as const, result };
        } catch (err) {
          const error = err instanceof Error ? err.message : JSON.stringify(err);
          summaries.push({ scope: handle.workflowId, status: 'FAILED', runId: handle.runId, error });
          return { status: 'FAILED' as const, error, handle };
        }
      })
    );

    const failed = waveResults.filter((r) => r.status === 'FAILED');
    if (failed.length > 0 && failPolicy === 'fail-fast') {
      log.error(`Wave ${waveIndex + 1} failed and fail-fast is enabled. Aborting pipeline.`);
      throw new Error(`Pipeline failed during wave ${waveIndex + 1}: ${failed.map((f) => f.error).join('; ')}`);
    }

    log.info(`Wave ${waveIndex + 1} completed with ${failed.length} failures.`);
  }

  return {
    workflowId: workflowInfo().workflowId,
    waves: input.waves.length,
    summaries,
    failPolicy,
    awaitApproval,
    status: 'COMPLETED',
  };
}
