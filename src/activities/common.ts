import { format } from 'date-fns';

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface LogContext {
  correlationId: string;
  scope: string;
  env: string;
  step: string;
}

export const logWithContext = (ctx: LogContext, message: string, extra?: Record<string, unknown>) => {
  const timestamp = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  const payload = extra ? ` ${JSON.stringify(extra)}` : '';
  console.log(`[${timestamp}] [${ctx.correlationId}] [${ctx.scope}@${ctx.env}] [${ctx.step}] ${message}${payload}`);
};
