/**
 * Webhook Controller
 * 
 * Handles incoming webhook requests for new leads and conversions
 */

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { queueSmsMessage } = require('../services/smsService');
const { createSchedule } = require('../services/scheduleService');
const { validateLeadData } = require('../utils/validators');
const { lookupTimezone } = require('../utils/timezoneUtils');

const prisma = new PrismaClient();

/**
 * Process incoming lead webhook
 * Validates lead data, persists to database, and schedules initial SMS
 */
exports.processLeadWebhook = async (req, res) => {
  try {
    const leadData = req.body;
    
    // Validate the incoming lead data
    const validationResult = validateLeadData(leadData);
    if (!validationResult.valid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid lead data', 
        errors: validationResult.errors 
      });
    }
    
    // Generate a unique leadId for use in SMS URLs if not provided
    const leadId = leadData.leadId || uuidv4().substring(0, 6);
    
    // Lookup timezone based on ZIP code
    const timezone = await lookupTimezone(leadData.zip);
    
    // Create lead record in database
    const lead = await prisma.lead.create({
      data: {
        leadId,
        firstName: leadData.firstName,
        lastName: leadData.lastName || '',
        email: leadData.email || '',
        phone: leadData.phone,
        vehicleYear: leadData.vehicleYear || null,
        vehicleMake: leadData.vehicleMake || '',
        city: leadData.city || '',
        state: leadData.state || '',
        zip: leadData.zip || '',
        savings: leadData.savings || null,
        timezone,
        rawLeadData: leadData,
      }
    });
    
    // Queue the initial SMS (Day 0)
    await queueSmsMessage(lead.id, 0);
    
    // Create the follow-up schedule for this lead
    await createSchedule(lead.id);
    
    return res.status(200).json({
      success: true,
      message: 'Lead received and processed successfully',
      leadId
    });
  } catch (error) {
    console.error('Error processing lead webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing lead',
      error: error.message
    });
  }
};

/**
 * Process conversion webhook
 * Records a conversion event for a lead
 */
exports.processConversionWebhook = async (req, res) => {
  try {
    const { leadId, amount, type, data } = req.body;
    
    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'leadId is required'
      });
    }
    
    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Record the conversion
    await prisma.conversion.create({
      data: {
        leadId: lead.id,
        amount: amount || null,
        type: type || 'standard',
        data: data || {},
      }
    });
    
    // Update lead status
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'CONVERTED' }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Conversion recorded successfully'
    });
  } catch (error) {
    console.error('Error processing conversion webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing conversion',
      error: error.message
    });
  }
};
