#!/usr/bin/env node

/**
 * Cron script to schedule follow-up messages for leads
 * Run this script once daily via IONOS cron
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

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
          
          // Get templates for this follow-up day
          const templates = await prisma.template.findMany({
            where: {
              day: daysSinceCreation
            }
          });
          
          if (templates.length === 0) {
            console.log(`No templates found for day ${daysSinceCreation}`);
            continue;
          }
          
          // Select a random template variant
          const randomIndex = Math.floor(Math.random() * templates.length);
          const selectedTemplate = templates[randomIndex];
          
          // Replace placeholders in template
          let messageContent = selectedTemplate.content;
          messageContent = messageContent.replace(/{FirstName}/g, lead.firstName || 'there');
          messageContent = messageContent.replace(/{LastName}/g, lead.lastName || '');
          messageContent = messageContent.replace(/{LeadID}/g, lead.id);
          messageContent = messageContent.replace(/{VehicleMake}/g, lead.vehicleMake || 'your vehicle');
          messageContent = messageContent.replace(/{VehicleModel}/g, lead.vehicleModel || '');
          messageContent = messageContent.replace(/{VehicleYear}/g, lead.vehicleYear || '');
          messageContent = messageContent.replace(/{Savings}/g, lead.potentialSavings || '$XXX');
          
          // Calculate send time (default to 10 AM in lead's timezone)
          const leadTimezone = lead.timezone || 'America/New_York';
          const sendTime = dayjs().tz(leadTimezone).hour(10).minute(0).second(0);
          
          // Schedule the message
          await prisma.scheduledMessage.create({
            data: {
              leadId: lead.id,
              content: messageContent,
              templateId: selectedTemplate.id,
              scheduledTime: sendTime.toDate(),
              status: 'PENDING'
            }
          });
          
          console.log(`Scheduled day ${daysSinceCreation} message for lead ${lead.id}`);
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
