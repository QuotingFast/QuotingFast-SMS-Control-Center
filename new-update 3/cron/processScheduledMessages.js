/**
 * Process Scheduled Messages Cron Job
 * 
 * This script is designed to run as a cron job to process scheduled messages
 * when Redis/BullMQ is not available (e.g., on Render deployment)
 */

const { PrismaClient } = require('@prisma/client');
const { processSmsJob } = require('../services/smsService');

// Load environment variables
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * Process pending scheduled messages that are due
 */
async function processScheduledMessages() {
  try {
    console.log('Checking for scheduled messages to process...');
    
    // Find scheduled messages that are due
    const now = new Date();
    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: now // Less than or equal to current time
        }
      },
      take: 10 // Process in batches to avoid overload
    });
    
    console.log(`Found ${scheduledMessages.length} messages to process`);
    
    // Process each message
    for (const message of scheduledMessages) {
      console.log(`Processing scheduled message ${message.id}`);
      
      try {
        // Update status to PROCESSING to prevent duplicate processing
        await prisma.scheduledMessage.update({
          where: { id: message.id },
          data: { status: 'PROCESSING' }
        });
        
        // Process the message
        await processSmsJob({ data: { scheduledMessageId: message.id } });
        
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        
        // Mark as failed
        await prisma.scheduledMessage.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            processedAt: new Date()
          }
        });
      }
    }
    
    console.log('Finished processing scheduled messages');
  } catch (error) {
    console.error('Error in processScheduledMessages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
processScheduledMessages()
  .then(() => {
    console.log('Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Process failed:', error);
    process.exit(1);
  });
