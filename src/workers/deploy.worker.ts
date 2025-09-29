import { Worker } from '@temporalio/worker';
import * as deployActivities from '../activities/deploy.activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('../workflows/deploy.workflow'),
    activities: deployActivities,
    taskQueue: 'deploy-queue',
  });

  console.log('Deploy worker listening on task queue deploy-queue');
  await worker.run();
}

run().catch((err) => {
  console.error('Deploy worker failed', err);
  process.exit(1);
});
