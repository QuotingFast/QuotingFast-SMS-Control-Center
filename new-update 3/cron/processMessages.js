#!/usr/bin/env node

/**
 * Cron script to process scheduled SMS messages
 * Run this script every minute via IONOS cron
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const twilio = require('twilio');
const { isTcpaCompliant } = require('../utils/tcpaUtils');
const { truncateMessage } = require('../utils/smsUtils');

const prisma = new PrismaClient();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function processScheduledMessages() {
  console.log(`[${new Date().toISOString()}] Processing scheduled messages...`);
  
  try {
    // Get all pending messages scheduled for now or earlier
    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: 'PENDING',
        scheduledTime: {
          lte: new Date()
        }
      },
      include: {
        lead: true
      }
    });
    
    console.log(`Found ${scheduledMessages.length} messages to process`);
    
    // Process each message
    for (const message of scheduledMessages) {
      try {
        // Check TCPA compliance
        const isCompliant = await isTcpaCompliant(message.lead.phone, message.lead.timezone);
        
        if (!isCompliant) {
          console.log(`Skipping message ${message.id} - outside of TCPA hours`);
          continue; // Skip this message, will be picked up in next run when compliant
        }
        
        // Truncate message if needed
        const truncatedContent = truncateMessage(message.content);
        
        // Send the message
        const twilioMessage = await twilioClient.messages.create({
          body: truncatedContent,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: message.lead.phone
        });
        
        // Update message status
        await prisma.scheduledMessage.update({
          where: { id: message.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            twilioMessageId: twilioMessage.sid
          }
        });
        
        // Record the sent message
        await prisma.message.create({
          data: {
            leadId: message.lead.id,
            content: truncatedContent,
            direction: 'OUTBOUND',
            twilioMessageId: twilioMessage.sid,
            status: 'SENT'
          }
        });
        
        console.log(`Successfully sent message ${message.id} to ${message.lead.phone}`);
      } catch (err) {
        console.error(`Error processing message ${message.id}:`, err);
        
        // Mark as failed
        await prisma.scheduledMessage.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            error: err.message
          }
        });
      }
    }
  } catch (err) {
    console.error('Error fetching scheduled messages:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the process
processScheduledMessages()
  .then(() => {
    console.log('Finished processing scheduled messages');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
