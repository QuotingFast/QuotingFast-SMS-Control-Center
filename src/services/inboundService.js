/**
 * Inbound Service
 * 
 * Handles incoming SMS messages, including opt-out requests
 */

const { PrismaClient } = require('@prisma/client');
const { isOptOutMessage } = require('../utils/smsUtils');
const { cancelSchedule } = require('./scheduleService');

const prisma = new PrismaClient();

/**
 * Process an inbound SMS message
 * @param {object} job - The Bull job object
 * @returns {Promise<object>} - The processing result
 */
exports.processInboundMessage = async (job) => {
  const { from, body, twilioSid } = job.data;
  
  try {
    // Find the lead by phone number
    const lead = await prisma.lead.findFirst({
      where: { phone: from }
    });
    
    if (!lead) {
      console.warn(`Received SMS from unknown number: ${from}`);
      return { success: false, reason: 'Unknown sender' };
    }
    
    // Record the inbound message
    const message = await prisma.message.create({
      data: {
        leadId: lead.id,
        direction: 'INBOUND',
        status: 'RECEIVED',
        body,
        twilioSid,
        sentAt: new Date(),
        deliveredAt: new Date()
      }
    });
    
    // Check if this is an opt-out message
    if (isOptOutMessage(body)) {
      await handleOptOut(lead.id);
      return { 
        success: true, 
        messageId: message.id, 
        action: 'opt-out',
        leadId: lead.id
      };
    }
    
    // Handle other types of inbound messages here
    // For now, we just record them
    
    return { 
      success: true, 
      messageId: message.id,
      action: 'recorded',
      leadId: lead.id
    };
  } catch (error) {
    console.error('Error processing inbound message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle an opt-out request
 * @param {string} leadId - The lead ID
 * @returns {Promise<object>} - The updated lead
 */
async function handleOptOut(leadId) {
  try {
    // Update lead status to opted out
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'OPTED_OUT' }
    });
    
    // Cancel all pending scheduled messages
    await cancelSchedule(leadId);
    
    console.log(`Lead ${leadId} has opted out. All scheduled messages cancelled.`);
    
    return updatedLead;
  } catch (error) {
    console.error('Error handling opt-out:', error);
    throw error;
  }
}
