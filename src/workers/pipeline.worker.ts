import { Worker } from '@temporalio/worker';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('../workflows/pipeline.workflow'),
    taskQueue: 'pipeline-queue',
  });

  console.log('Pipeline worker listening on task queue pipeline-queue');
  await worker.run();
}

run().catch((err) => {
  console.error('Pipeline worker failed', err);
  process.exit(1);
});
