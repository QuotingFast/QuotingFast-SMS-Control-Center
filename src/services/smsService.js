/**
 * SMS Service
 * 
 * Handles SMS sending, template processing, and TCPA compliance
 */

const { PrismaClient } = require('@prisma/client');
const twilio = require('twilio');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { truncateSmsContent } = require('../utils/smsUtils');
const { isWithinTcpaHours } = require('../utils/tcpaUtils');

// Configure dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

// Only initialize Queue if REDIS_URL is available
let smsQueue;
if (process.env.REDIS_URL) {
  const { Queue } = require('bull');
  smsQueue = new Queue('sms-queue', process.env.REDIS_URL);
}

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Queue an SMS message for a lead based on day in sequence
 * @param {string} leadId - The lead ID
 * @param {number} day - The day in sequence (0, 1, 3, 5, etc.)
 * @returns {Promise<object>} - The scheduled message
 */
exports.queueSmsMessage = async (leadId, day) => {
  try {
    // Get the lead data
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    // Check if lead has opted out
    if (lead.status === 'OPTED_OUT') {
      console.log(`Lead ${leadId} has opted out, not sending SMS`);
      return null;
    }
    
    // Get a random template variant for the specified day
    const variant = Math.floor(Math.random() * 6) + 1; // Random number 1-6
    
    // Get the template
    const template = await prisma.smsTemplate.findUnique({
      where: {
        day_variant: {
          day,
          variant
        }
      }
    });
    
    if (!template) {
      throw new Error(`Template not found for day ${day}, variant ${variant}`);
    }
    
    // Calculate when to send the message
    let scheduledFor;
    
    if (day === 0) {
      // Day 0 is immediate, but still respect TCPA hours
      scheduledFor = await getNextValidSendTime(lead);
    } else {
      // For follow-up days, schedule for the appropriate day at a good sending time
      scheduledFor = await getScheduledSendTime(lead, day);
    }
    
    // Create the scheduled message record
    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        leadId: lead.id,
        templateId: template.id,
        day,
        variant,
        scheduledFor,
        status: 'PENDING'
      }
    });
    
    // If Redis is available, add to the BullMQ queue
    // Otherwise, for Render deployment without Redis, we'll handle it differently
    let jobId = `manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    if (smsQueue) {
      // Add to the BullMQ queue if available
      const job = await smsQueue.add(
        'send-sms',
        {
          scheduledMessageId: scheduledMessage.id
        },
        {
          delay: scheduledFor.getTime() - Date.now(),
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 300000 // 5 minutes in milliseconds
          }
        }
      );
      
      jobId = job.id.toString();
      
      // For day 0 messages (immediate), process right away if within TCPA hours
      if (day === 0 && isWithinTcpaHours(lead)) {
        // Process immediately for day 0
        await exports.processSmsJob({ data: { scheduledMessageId: scheduledMessage.id } });
      }
    } else {
      console.log('Redis not available, scheduling without queue');
      
      // For day 0 messages (immediate), process right away if within TCPA hours
      if (day === 0 && isWithinTcpaHours(lead)) {
        // Process immediately for day 0
        await exports.processSmsJob({ data: { scheduledMessageId: scheduledMessage.id } });
      }
      // For other days, we'll need to implement a different scheduling mechanism
      // This could be a cron job that checks for scheduled messages
    }
    
    // Update the scheduled message with the job ID
    await prisma.scheduledMessage.update({
      where: { id: scheduledMessage.id },
      data: { jobId }
    });
    
    return scheduledMessage;
  } catch (error) {
    console.error('Error queueing SMS message:', error);
    throw error;
  }
};

/**
 * Process an SMS message from the queue
 * @param {object} job - The Bull job object
 * @returns {Promise<object>} - The sent message
 */
exports.processSmsJob = async (job) => {
  const { scheduledMessageId } = job.data;
  
  try {
    // Get the scheduled message
    const scheduledMessage = await prisma.scheduledMessage.findUnique({
      where: { id: scheduledMessageId },
      include: {
        lead: true,
        template: true
      }
    });
    
    if (!scheduledMessage) {
      throw new Error(`Scheduled message not found: ${scheduledMessageId}`);
    }
    
    // Check if lead has opted out
    if (scheduledMessage.lead.status === 'OPTED_OUT') {
      await prisma.scheduledMessage.update({
        where: { id: scheduledMessageId },
        data: {
          status: 'CANCELLED',
          processedAt: new Date()
        }
      });
      return { success: false, reason: 'Lead opted out' };
    }
    
    // Double-check TCPA hours before sending
    const canSendNow = await isWithinTcpaHours(scheduledMessage.lead);
    if (!canSendNow) {
      // Reschedule for next valid time
      const nextValidTime = await getNextValidSendTime(scheduledMessage.lead);
      
      // Update the scheduled time
      await prisma.scheduledMessage.update({
        where: { id: scheduledMessageId },
        data: { scheduledFor: nextValidTime }
      });
      
      // Reschedule the job
      return { 
        success: false, 
        reason: 'Outside TCPA hours', 
        rescheduledFor: nextValidTime 
      };
    }
    
    // Process the template with lead data
    const messageBody = await processTemplate(
      scheduledMessage.template.body,
      scheduledMessage.lead
    );
    
    // Send the SMS via Twilio
    const sentMessage = await sendSms(
      scheduledMessage.lead.phone,
      messageBody
    );
    
    // Record the message in the database
    const message = await prisma.message.create({
      data: {
        leadId: scheduledMessage.lead.id,
        direction: 'OUTBOUND',
        status: 'SENT',
        body: messageBody,
        twilioSid: sentMessage.sid,
        sentAt: new Date()
      }
    });
    
    // Update the scheduled message status
    await prisma.scheduledMessage.update({
      where: { id: scheduledMessageId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });
    
    return { success: true, messageId: message.id };
  } catch (error) {
    console.error('Error processing SMS job:', error);
    
    // Update the scheduled message status
    await prisma.scheduledMessage.update({
      where: { id: scheduledMessageId },
      data: {
        status: 'FAILED',
        processedAt: new Date()
      }
    });
    
    // If this was the first attempt, let Bull retry
    if (job.attemptsMade < job.opts.attempts) {
      throw error; // This will trigger Bull's retry mechanism
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Send an SMS message via Twilio
 * @param {string} to - The recipient phone number
 * @param {string} body - The message body
 * @returns {Promise<object>} - The Twilio message object
 */
async function sendSms(to, body) {
  try {
    const message = await twilioClient.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body
    });
    
    return message;
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    throw error;
  }
}

/**
 * Process an SMS template with lead data
 * @param {string} template - The template string with placeholders
 * @param {object} lead - The lead data
 * @returns {string} - The processed template
 */
async function processTemplate(template, lead) {
  try {
    // Replace placeholders with lead data
    let processedTemplate = template
      .replace(/{FirstName}/g, lead.firstName || '')
      .replace(/{VehicleYear}/g, lead.vehicleYear?.toString() || '')
      .replace(/{VehicleMake}/g, lead.vehicleMake || '')
      .replace(/{City}/g, lead.city || '')
      .replace(/{State}/g, lead.state || '')
      .replace(/{ZIP}/g, lead.zip || '')
      .replace(/{LeadID}/g, lead.leadId || '')
      .replace(/{Savings}/g, lead.savings?.toString() || '');
    
    // Ensure the message is within the 160 character limit
    processedTemplate = truncateSmsContent(processedTemplate);
    
    return processedTemplate;
  } catch (error) {
    console.error('Error processing template:', error);
    throw error;
  }
}

/**
 * Get the next valid send time based on TCPA hours
 * @param {object} lead - The lead object with timezone
 * @returns {Date} - The next valid send time
 */
async function getNextValidSendTime(lead) {
  const now = dayjs();
  const leadTz = lead.timezone || 'America/New_York'; // Default to Eastern Time
  
  // Get TCPA hours from environment
  const tcpaStartHour = parseInt(process.env.TCPA_START_HOUR || '8', 10);
  const tcpaEndHour = parseInt(process.env.TCPA_END_HOUR || '21', 10);
  
  // Convert current time to lead's timezone
  const leadLocalTime = now.tz(leadTz);
  const leadHour = leadLocalTime.hour();
  
  // Check if current time is within TCPA hours
  if (leadHour >= tcpaStartHour && leadHour < tcpaEndHour) {
    // Can send now
    return now.toDate();
  } else {
    // Need to wait until TCPA start hour tomorrow
    let nextValidTime;
    
    if (leadHour >= tcpaEndHour) {
      // After end hour, schedule for start hour tomorrow
      nextValidTime = leadLocalTime.add(1, 'day').hour(tcpaStartHour).minute(0).second(0);
    } else {
      // Before start hour, schedule for start hour today
      nextValidTime = leadLocalTime.hour(tcpaStartHour).minute(0).second(0);
    }
    
    return nextValidTime.toDate();
  }
}

/**
 * Get a scheduled send time for a follow-up message
 * @param {object} lead - The lead object
 * @param {number} day - The day in sequence
 * @returns {Date} - The scheduled send time
 */
async function getScheduledSendTime(lead, day) {
  const leadCreatedAt = dayjs(lead.createdAt);
  const leadTz = lead.timezone || 'America/New_York';
  
  // Get TCPA hours from environment
  const tcpaStartHour = parseInt(process.env.TCPA_START_HOUR || '8', 10);
  const tcpaEndHour = parseInt(process.env.TCPA_END_HOUR || '21', 10);
  
  // Calculate the target date (leadCreatedAt + day)
  const targetDate = leadCreatedAt.add(day, 'day');
  
  // Set to a good sending time (10 AM in lead's timezone)
  const goodSendingHour = tcpaStartHour + 2; // 2 hours after TCPA start
  const scheduledTime = targetDate
    .tz(leadTz)
    .hour(goodSendingHour)
    .minute(0)
    .second(0);
  
  return scheduledTime.toDate();
}
