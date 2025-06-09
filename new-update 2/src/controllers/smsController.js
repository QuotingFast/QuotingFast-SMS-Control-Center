/**
 * SMS Controller
 * 
 * Handles SMS-related operations such as sending manual messages,
 * handling inbound webhooks from Twilio, and managing opt-outs
 */

const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bull');
const { truncateSmsContent } = require('../utils/smsUtils');
const { isWithinTcpaHours } = require('../utils/tcpaUtils');
const { validateCustomMessage } = require('../utils/validators');
const { inboundQueue } = require('../jobs/queueSetup');

const prisma = new PrismaClient();

/**
 * Send a manual SMS message
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.sendManualSms = async (req, res) => {
  try {
    const { leadId, body } = req.body;
    
    // Validate the request
    const validationResult = validateCustomMessage({ leadId, body });
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message data',
        errors: validationResult.errors
      });
    }
    
    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Check if lead has opted out
    if (lead.status === 'OPTED_OUT') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send SMS to opted-out lead'
      });
    }
    
    // Check TCPA hours
    const canSendNow = await isWithinTcpaHours(lead);
    if (!canSendNow) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send SMS outside of TCPA hours (8 AM - 9 PM recipient local time)'
      });
    }
    
    // Ensure the message is within the 160 character limit
    const truncatedBody = truncateSmsContent(body);
    
    // Create a job to send the SMS
    const job = await new Queue('sms-queue', process.env.REDIS_URL).add(
      'send-manual-sms',
      {
        leadId: lead.id,
        phone: lead.phone,
        body: truncatedBody
      }
    );
    
    // Create a record of the scheduled message
    const message = await prisma.message.create({
      data: {
        leadId: lead.id,
        direction: 'OUTBOUND',
        status: 'PENDING',
        body: truncatedBody,
        sentAt: new Date()
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'SMS queued successfully',
      messageId: message.id,
      jobId: job.id
    });
  } catch (error) {
    console.error('Error sending manual SMS:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending SMS',
      error: error.message
    });
  }
};

/**
 * Handle inbound SMS webhook from Twilio
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.handleInboundSms = async (req, res) => {
  try {
    const { From, Body, MessageSid } = req.body;
    
    // Queue the inbound message for processing
    await inboundQueue.add(
      'process-inbound',
      {
        from: From,
        body: Body,
        twilioSid: MessageSid
      }
    );
    
    // Return a TwiML response
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error('Error handling inbound SMS:', error);
    res.status(500).send('<Response></Response>');
  }
};

/**
 * Get message history for a lead
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getMessageHistory = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Get all messages for this lead
    const messages = await prisma.message.findMany({
      where: { leadId: lead.id },
      orderBy: { sentAt: 'desc' }
    });
    
    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error getting message history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting message history',
      error: error.message
    });
  }
};

/**
 * Get scheduled messages for a lead
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getScheduledMessages = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Get all scheduled messages for this lead
    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: { 
        leadId: lead.id,
        status: 'PENDING'
      },
      include: { template: true },
      orderBy: { scheduledFor: 'asc' }
    });
    
    return res.status(200).json({
      success: true,
      scheduledMessages
    });
  } catch (error) {
    console.error('Error getting scheduled messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting scheduled messages',
      error: error.message
    });
  }
};
