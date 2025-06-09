/**
 * Schedule Service
 * 
 * Handles creation and management of the 30-day follow-up sequence
 */

const { PrismaClient } = require('@prisma/client');
const { queueSmsMessage } = require('./smsService');

const prisma = new PrismaClient();

// Define the follow-up schedule days
const FOLLOW_UP_DAYS = [0, 1, 3, 5, 7, 10, 14, 21, 28];

/**
 * Create the complete follow-up schedule for a lead
 * @param {string} leadId - The lead ID
 * @returns {Promise<Array>} - Array of scheduled messages
 */
exports.createSchedule = async (leadId) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    // Skip day 0 as it's handled immediately upon lead creation
    const scheduleDays = FOLLOW_UP_DAYS.filter(day => day > 0);
    
    const scheduledMessages = [];
    
    // Create scheduled messages for each follow-up day
    for (const day of scheduleDays) {
      const scheduledMessage = await queueSmsMessage(leadId, day);
      scheduledMessages.push(scheduledMessage);
    }
    
    return scheduledMessages;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

/**
 * Cancel all pending scheduled messages for a lead
 * @param {string} leadId - The lead ID
 * @returns {Promise<number>} - Number of cancelled messages
 */
exports.cancelSchedule = async (leadId) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    // Find all pending scheduled messages
    const pendingMessages = await prisma.scheduledMessage.findMany({
      where: {
        leadId: lead.id,
        status: 'PENDING'
      }
    });
    
    // Update all to cancelled
    await prisma.scheduledMessage.updateMany({
      where: {
        leadId: lead.id,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED',
        processedAt: new Date()
      }
    });
    
    return pendingMessages.length;
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    throw error;
  }
};

/**
 * Reschedule a specific message
 * @param {string} scheduledMessageId - The scheduled message ID
 * @param {Date} newScheduledTime - The new scheduled time
 * @returns {Promise<object>} - The updated scheduled message
 */
exports.rescheduleMessage = async (scheduledMessageId, newScheduledTime) => {
  try {
    const scheduledMessage = await prisma.scheduledMessage.findUnique({
      where: { id: scheduledMessageId },
      include: { lead: true }
    });
    
    if (!scheduledMessage) {
      throw new Error(`Scheduled message not found: ${scheduledMessageId}`);
    }
    
    // Only pending messages can be rescheduled
    if (scheduledMessage.status !== 'PENDING') {
      throw new Error(`Cannot reschedule message with status: ${scheduledMessage.status}`);
    }
    
    // Update the scheduled time
    const updatedMessage = await prisma.scheduledMessage.update({
      where: { id: scheduledMessageId },
      data: { scheduledFor: newScheduledTime }
    });
    
    return updatedMessage;
  } catch (error) {
    console.error('Error rescheduling message:', error);
    throw error;
  }
};

/**
 * Get all scheduled messages for a lead
 * @param {string} leadId - The lead ID
 * @returns {Promise<Array>} - Array of scheduled messages
 */
exports.getSchedule = async (leadId) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: { leadId: lead.id },
      include: { template: true },
      orderBy: { scheduledFor: 'asc' }
    });
    
    return scheduledMessages;
  } catch (error) {
    console.error('Error getting schedule:', error);
    throw error;
  }
};
