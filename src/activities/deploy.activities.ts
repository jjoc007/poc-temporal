import { randomInt } from 'crypto';
import { logWithContext, sleep } from './common';

export interface DeployInput {
  scope: string;
  version: string;
  env: string;
  correlationId: string;
}

export interface ActivityResult {
  ok: boolean;
  step: string;
  details?: Record<string, unknown>;
}

const buildContext = (input: DeployInput, step: string) => ({
  correlationId: input.correlationId,
  scope: input.scope,
  env: input.env,
  step,
});

export async function logStart(input: DeployInput): Promise<ActivityResult> {
  logWithContext(buildContext(input, 'logStart'), 'Starting deploy', { version: input.version });
  return { ok: true, step: 'logStart' };
}

export async function validatePermissions(input: DeployInput): Promise<ActivityResult> {
  logWithContext(buildContext(input, 'validatePermissions'), 'Validating permissions');
  await sleep(500);
  return { ok: true, step: 'validatePermissions' };
}

export async function admissionCheck(input: DeployInput): Promise<ActivityResult> {
  logWithContext(buildContext(input, 'admissionCheck'), 'Checking cluster capacity');
  await sleep(1000 + randomInt(500));
  return { ok: true, step: 'admissionCheck' };
}

export async function provisionCandidate(input: DeployInput): Promise<ActivityResult> {
  logWithContext(buildContext(input, 'provisionCandidate'), 'Provisioning candidate');
  await sleep(2000);
  return { ok: true, step: 'provisionCandidate' };
}

export async function shiftTraffic(input: DeployInput & { strategy?: string }): Promise<ActivityResult> {
  const strategy = input.strategy ?? 'BLUE_GREEN';
  logWithContext(buildContext(input, 'shiftTraffic'), 'Shifting traffic', { strategy });
  await sleep(1000);
  return { ok: true, step: 'shiftTraffic', details: { strategy } };
}

export async function safeVerify(input: DeployInput): Promise<{ ok: boolean; step: string; decision: 'GO' | 'NO_GO' }> {
  logWithContext(buildContext(input, 'safeVerify'), 'Running smoke checks');
  await sleep(2000);
  return { ok: true, step: 'safeVerify', decision: 'GO' };
}

export async function rollback(input: DeployInput): Promise<ActivityResult> {
  logWithContext(buildContext(input, 'rollback'), 'Rolling back deployment');
  await sleep(1500);
  return { ok: true, step: 'rollback' };
}

export async function logEnd(input: DeployInput): Promise<ActivityResult> {
  logWithContext(buildContext(input, 'logEnd'), 'Deployment finished', { version: input.version });
  return { ok: true, step: 'logEnd' };
}
