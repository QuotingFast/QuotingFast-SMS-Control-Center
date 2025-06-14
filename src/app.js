/**
 * QuotingFast SMS Control Center - Application Entry Point
 * 
 * This file initializes the database connection and job processors
 * before starting the Express server.
 * Modified to work with or without Redis (for Render deployment)
 */

const { PrismaClient } = require('@prisma/client');
const { setupBullQueues, areQueuesAvailable } = require('./jobs/queueSetup');
const { initializeDefaultSettings } = require('./controllers/settingsController');
const server = require('./server');

// Initialize Prisma client
const prisma = new PrismaClient();

// Connect to the database
async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('Connected to database successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

// Initialize job queues and processors
async function initializeJobQueues() {
  try {
    if (areQueuesAvailable()) {
      await setupBullQueues();
      console.log('Job queues initialized successfully');
    } else {
      console.log('Redis not available - running without job queues');
      console.log('Scheduled messages will be processed by cron jobs');
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize job queues:', error);
    // Don't fail the application startup if queues can't be initialized
    // This allows the app to run without Redis on Render
    console.log('Continuing without job queues');
    return true;
  }
}

// Main initialization function
async function initialize() {
  const dbConnected = await connectToDatabase();
  
  if (!dbConnected) {
    console.error('Exiting due to database connection failure');
    process.exit(1);
  }
  
  // Initialize default settings
  await initializeDefaultSettings();
  console.log('Default settings initialized');
  
  // Initialize job queues
  await initializeJobQueues();
  
  // The server is already started in server.js
  console.log('QuotingFast SMS Control Center initialized successfully');
}

// Start the application
initialize().catch((error) => {
  console.error('Failed to initialize application:', error);
  process.exit(1);
});

// Handle application shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
