/**
 * Queue Setup
 * 
 * Initializes and configures BullMQ queues for job processing
 */

const { Queue, Worker, QueueScheduler } = require('bull');
const { processSmsJob } = require('../services/smsService');
const { processInboundMessage } = require('../services/inboundService');

// Create queues
const smsQueue = new Queue('sms-queue', process.env.REDIS_URL);
const inboundQueue = new Queue('inbound-queue', process.env.REDIS_URL);

/**
 * Setup BullMQ queues and workers
 */
exports.setupBullQueues = async () => {
  // Create queue schedulers (handles delayed jobs and retries)
  const smsQueueScheduler = new QueueScheduler('sms-queue', {
    connection: process.env.REDIS_URL
  });
  
  const inboundQueueScheduler = new QueueScheduler('inbound-queue', {
    connection: process.env.REDIS_URL
  });
  
  // Create workers to process jobs
  const smsWorker = new Worker('sms-queue', async (job) => {
    console.log(`Processing SMS job ${job.id}`);
    return await processSmsJob(job);
  }, {
    connection: process.env.REDIS_URL,
    concurrency: 5 // Process up to 5 jobs at once
  });
  
  const inboundWorker = new Worker('inbound-queue', async (job) => {
    console.log(`Processing inbound message job ${job.id}`);
    return await processInboundMessage(job);
  }, {
    connection: process.env.REDIS_URL,
    concurrency: 5
  });
  
  // Set up event handlers for the workers
  smsWorker.on('completed', (job, result) => {
    console.log(`SMS job ${job.id} completed with result:`, result);
  });
  
  smsWorker.on('failed', (job, error) => {
    console.error(`SMS job ${job.id} failed with error:`, error);
  });
  
  inboundWorker.on('completed', (job, result) => {
    console.log(`Inbound message job ${job.id} completed with result:`, result);
  });
  
  inboundWorker.on('failed', (job, error) => {
    console.error(`Inbound message job ${job.id} failed with error:`, error);
  });
  
  // Return the queues and workers
  return {
    queues: {
      smsQueue,
      inboundQueue
    },
    schedulers: {
      smsQueueScheduler,
      inboundQueueScheduler
    },
    workers: {
      smsWorker,
      inboundWorker
    }
  };
};

// Export the queues for use in other modules
exports.smsQueue = smsQueue;
exports.inboundQueue = inboundQueue;
