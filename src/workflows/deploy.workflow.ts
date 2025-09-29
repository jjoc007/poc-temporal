import { proxyActivities, uuid4, workflowInfo } from '@temporalio/workflow';
import type {
  admissionCheck,
  logEnd,
  logStart,
  provisionCandidate,
  rollback,
  safeVerify,
  shiftTraffic,
  validatePermissions,
} from '../activities/deploy.activities';

export interface DeployWorkflowInput {
  scope: string;
  version: string;
  env: string;
}

const quickActivityOptions = {
  startToCloseTimeout: '10s',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    backoffCoefficient: 2,
  },
} as const;

const longActivityOptions = {
  startToCloseTimeout: '1m',
  retry: {
    maximumAttempts: 2,
    initialInterval: '5s',
    backoffCoefficient: 2,
  },
} as const;

const quickActivities = proxyActivities<{
  logStart: typeof logStart;
  validatePermissions: typeof validatePermissions;
  admissionCheck: typeof admissionCheck;
  shiftTraffic: typeof shiftTraffic;
  logEnd: typeof logEnd;
}>(quickActivityOptions);

const longActivities = proxyActivities<{
  provisionCandidate: typeof provisionCandidate;
  safeVerify: typeof safeVerify;
  rollback: typeof rollback;
}>(longActivityOptions);

export async function DeployWorkflow(input: DeployWorkflowInput) {
  const correlationId = uuid4();
  const payload = { ...input, correlationId };
  await quickActivities.logStart(payload);
  await quickActivities.validatePermissions(payload);
  await quickActivities.admissionCheck(payload);
  await longActivities.provisionCandidate(payload);
  await quickActivities.shiftTraffic({ ...payload, strategy: 'BLUE_GREEN' });
  const verification = await longActivities.safeVerify(payload);
  if (verification.decision !== 'GO') {
    await longActivities.rollback(payload);
    throw new Error(`Deployment for ${input.scope} rejected with decision ${verification.decision}`);
  }
  await quickActivities.logEnd(payload);
  return {
    workflowId: workflowInfo().workflowId,
    scope: input.scope,
    version: input.version,
    env: input.env,
    correlationId,
    status: 'COMPLETED',
  };
}
