/**
 * Queue Setup
 * 
 * Initializes and configures BullMQ queues for job processing
 * Modified to work with or without Redis (for Render deployment)
 */

const { processSmsJob } = require('../services/smsService');
const { processInboundMessage } = require('../services/inboundService');

// Initialize queues as null
let smsQueue = null;
let inboundQueue = null;

// Only require Bull and create queues if REDIS_URL is available
if (process.env.REDIS_URL) {
  const { Queue } = require('bull');
  smsQueue = new Queue('sms-queue', process.env.REDIS_URL);
  inboundQueue = new Queue('inbound-queue', process.env.REDIS_URL);
  console.log('Redis queues initialized');
} else {
  console.log('Redis URL not found, running without job queues');
}

/**
 * Setup BullMQ queues and workers
 */
exports.setupBullQueues = async () => {
  // If Redis is not available, return empty objects
  if (!process.env.REDIS_URL) {
    console.log('Redis not available, skipping queue setup');
    return {
      queues: {},
      schedulers: {},
      workers: {}
    };
  }

  // Only import Bull components if Redis is available
  const { Worker, QueueScheduler } = require('bull');
  
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
// If Redis is not available, these will be null
exports.smsQueue = smsQueue;
exports.inboundQueue = inboundQueue;

// Export a helper function to check if queues are available
exports.areQueuesAvailable = () => !!process.env.REDIS_URL;
