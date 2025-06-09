/**
 * Lead Controller
 * 
 * Handles operations related to leads/contacts
 */

const { PrismaClient } = require('@prisma/client');
const { queueSmsMessage } = require('../services/smsService');
const { cancelSchedule, createSchedule } = require('../services/scheduleService');

const prisma = new PrismaClient();

/**
 * Get all leads with pagination
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getAllLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Build the where clause for filtering
    const where = {};
    
    if (status) {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { leadId: { contains: search } }
      ];
    }
    
    // Get leads with pagination
    const leads = await prisma.lead.findMany({
      where,
      skip,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        leadId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        vehicleYear: true,
        vehicleMake: true,
        city: true,
        state: true,
        zip: true,
        savings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
            calls: true,
            scheduledMessages: {
              where: { status: 'PENDING' }
            }
          }
        }
      }
    });
    
    // Get total count for pagination
    const totalLeads = await prisma.lead.count({ where });
    
    return res.status(200).json({
      success: true,
      leads,
      pagination: {
        total: totalLeads,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(totalLeads / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting leads',
      error: error.message
    });
  }
};

/**
 * Get a single lead by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 20
        },
        calls: {
          orderBy: { startedAt: 'desc' },
          take: 10
        },
        scheduledMessages: {
          where: { status: 'PENDING' },
          include: { template: true },
          orderBy: { scheduledFor: 'asc' }
        },
        conversion: true,
        clickEvents: {
          orderBy: { clickedAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error getting lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting lead',
      error: error.message
    });
  }
};

/**
 * Update a lead's status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['ACTIVE', 'OPTED_OUT', 'CONVERTED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { id }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Update the lead status
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status }
    });
    
    // If status is OPTED_OUT or ARCHIVED, cancel all scheduled messages
    if (status === 'OPTED_OUT' || status === 'ARCHIVED') {
      await cancelSchedule(id);
    }
    
    // If status is changed from OPTED_OUT to ACTIVE, recreate the schedule
    if (lead.status === 'OPTED_OUT' && status === 'ACTIVE') {
      await createSchedule(id);
    }
    
    return res.status(200).json({
      success: true,
      lead: updatedLead
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating lead status',
      error: error.message
    });
  }
};

/**
 * Send a test SMS to a lead
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.sendTestSms = async (req, res) => {
  try {
    const { id } = req.params;
    const { day } = req.body;
    
    // Validate day
    const validDays = [0, 1, 3, 5, 7, 10, 14, 21, 28];
    if (!validDays.includes(parseInt(day, 10))) {
      return res.status(400).json({
        success: false,
        message: `Invalid day. Must be one of: ${validDays.join(', ')}`
      });
    }
    
    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { id }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Queue the SMS message
    const scheduledMessage = await queueSmsMessage(id, parseInt(day, 10));
    
    return res.status(200).json({
      success: true,
      message: 'Test SMS queued successfully',
      scheduledMessage
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending test SMS',
      error: error.message
    });
  }
};

/**
 * Get lead statistics for dashboard
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getLeadStats = async (req, res) => {
  try {
    // Get counts by status
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    // Get total lead count
    const totalLeads = await prisma.lead.count();
    
    // Get conversion rate
    const conversions = await prisma.conversion.count();
    const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
    
    // Get opt-out rate
    const optOuts = statusCounts.find(s => s.status === 'OPTED_OUT')?._count?.status || 0;
    const optOutRate = totalLeads > 0 ? (optOuts / totalLeads) * 100 : 0;
    
    // Get message stats
    const messageStats = await prisma.message.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      where: {
        direction: 'OUTBOUND'
      }
    });
    
    // Format the stats for the dashboard
    const stats = {
      totalLeads,
      statusBreakdown: statusCounts.map(s => ({
        status: s.status,
        count: s._count.status
      })),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      optOutRate: parseFloat(optOutRate.toFixed(2)),
      messageStats: messageStats.map(s => ({
        status: s.status,
        count: s._count.status
      }))
    };
    
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting lead stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting lead stats',
      error: error.message
    });
  }
};
