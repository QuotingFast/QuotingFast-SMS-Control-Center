#!/usr/bin/env node

/**
 * Cron script to schedule follow-up messages for leads
 * Run this script once daily via cron
 * Compatible with both IONOS and Render deployments
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const smsService = require('../services/smsService');

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

// Follow-up days sequence
const FOLLOW_UP_DAYS = [0, 1, 3, 5, 7, 10, 14, 21, 28];

async function scheduleFollowUpMessages() {
  console.log(`[${new Date().toISOString()}] Scheduling follow-up messages...`);
  
  try {
    // Get all active leads
    const activeLeads = await prisma.lead.findMany({
      where: {
        status: 'ACTIVE'
      }
    });
    
    console.log(`Found ${activeLeads.length} active leads to process`);
    
    for (const lead of activeLeads) {
      try {
        // Calculate days since lead creation
        const createdAt = dayjs(lead.createdAt);
        const today = dayjs();
        const daysSinceCreation = today.diff(createdAt, 'day');
        
        // Check if today is a follow-up day
        if (FOLLOW_UP_DAYS.includes(daysSinceCreation)) {
          console.log(`Processing day ${daysSinceCreation} follow-up for lead ${lead.id}`);
          
          // Use the smsService to queue the message
          // This works with or without Redis
          try {
            const scheduledMessage = await smsService.queueSmsMessage(lead.id, daysSinceCreation);
            console.log(`Scheduled day ${daysSinceCreation} message for lead ${lead.id}`, 
              scheduledMessage ? `(ID: ${scheduledMessage.id})` : '(no message created)');
          } catch (queueError) {
            console.error(`Failed to queue message for lead ${lead.id} on day ${daysSinceCreation}:`, queueError);
          }
        }
      } catch (err) {
        console.error(`Error processing lead ${lead.id}:`, err);
      }
    }
  } catch (err) {
    console.error('Error fetching active leads:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the process
scheduleFollowUpMessages()
  .then(() => {
    console.log('Finished scheduling follow-up messages');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
