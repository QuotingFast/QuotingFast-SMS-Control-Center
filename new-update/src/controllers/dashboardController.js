/**
 * Dashboard Controller
 * 
 * Provides data for the reporting dashboard
 */

const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

/**
 * Get dashboard overview data
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    // Get counts by status
    const leadStatusCounts = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
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
    
    // Get total counts
    const totalLeads = await prisma.lead.count();
    const totalMessages = await prisma.message.count({
      where: { direction: 'OUTBOUND' }
    });
    const totalClicks = await prisma.clickEvent.count();
    const totalConversions = await prisma.conversion.count();
    
    // Calculate opt-out rate
    const optOuts = leadStatusCounts.find(s => s.status === 'OPTED_OUT')?._count?.status || 0;
    const optOutRate = totalLeads > 0 ? (optOuts / totalLeads) * 100 : 0;
    
    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
    
    // Format the overview data
    const overview = {
      kpis: {
        totalLeads,
        totalMessages,
        totalClicks,
        totalConversions,
        optOutRate: parseFloat(optOutRate.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2))
      },
      leadStatusBreakdown: leadStatusCounts.map(s => ({
        status: s.status,
        count: s._count.status
      })),
      messageStatusBreakdown: messageStats.map(s => ({
        status: s.status,
        count: s._count.status
      }))
    };
    
    return res.status(200).json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting dashboard overview',
      error: error.message
    });
  }
};

/**
 * Get message activity data for charts
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getMessageActivity = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let startDate;
    let groupByFormat;
    
    // Determine date range based on period
    switch (period) {
      case 'day':
        startDate = dayjs().subtract(24, 'hour').toDate();
        groupByFormat = 'YYYY-MM-DD HH';
        break;
      case 'week':
        startDate = dayjs().subtract(7, 'day').toDate();
        groupByFormat = 'YYYY-MM-DD';
        break;
      case 'month':
        startDate = dayjs().subtract(30, 'day').toDate();
        groupByFormat = 'YYYY-MM-DD';
        break;
      case 'year':
        startDate = dayjs().subtract(12, 'month').toDate();
        groupByFormat = 'YYYY-MM';
        break;
      default:
        startDate = dayjs().subtract(7, 'day').toDate();
        groupByFormat = 'YYYY-MM-DD';
    }
    
    // Get message activity data
    const messageActivity = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupByFormat}, "sentAt") as time_period,
        COUNT(*) FILTER (WHERE "direction" = 'OUTBOUND' AND "status" = 'DELIVERED') as delivered,
        COUNT(*) FILTER (WHERE "direction" = 'OUTBOUND' AND "status" = 'FAILED') as failed,
        COUNT(*) FILTER (WHERE "direction" = 'INBOUND') as received
      FROM "Message"
      WHERE "sentAt" >= ${startDate}
      GROUP BY time_period
      ORDER BY time_period ASC
    `;
    
    // Get click activity data
    const clickActivity = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupByFormat}, "clickedAt") as time_period,
        COUNT(*) as clicks
      FROM "ClickEvent"
      WHERE "clickedAt" >= ${startDate}
      GROUP BY time_period
      ORDER BY time_period ASC
    `;
    
    // Format the activity data for charts
    const formattedActivity = {
      labels: [],
      datasets: {
        delivered: [],
        failed: [],
        received: [],
        clicks: []
      }
    };
    
    // Process message activity data
    messageActivity.forEach(item => {
      const label = dayjs(item.time_period).format(
        period === 'day' ? 'HH:mm' : 
        period === 'year' ? 'MMM YYYY' : 
        'MMM DD'
      );
      
      if (!formattedActivity.labels.includes(label)) {
        formattedActivity.labels.push(label);
      }
      
      const index = formattedActivity.labels.indexOf(label);
      formattedActivity.datasets.delivered[index] = parseInt(item.delivered, 10) || 0;
      formattedActivity.datasets.failed[index] = parseInt(item.failed, 10) || 0;
      formattedActivity.datasets.received[index] = parseInt(item.received, 10) || 0;
      
      // Initialize clicks to 0 (will be updated from clickActivity)
      formattedActivity.datasets.clicks[index] = 0;
    });
    
    // Process click activity data
    clickActivity.forEach(item => {
      const label = dayjs(item.time_period).format(
        period === 'day' ? 'HH:mm' : 
        period === 'year' ? 'MMM YYYY' : 
        'MMM DD'
      );
      
      const index = formattedActivity.labels.indexOf(label);
      if (index !== -1) {
        formattedActivity.datasets.clicks[index] = parseInt(item.clicks, 10) || 0;
      }
    });
    
    return res.status(200).json({
      success: true,
      activity: formattedActivity
    });
  } catch (error) {
    console.error('Error getting message activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting message activity',
      error: error.message
    });
  }
};

/**
 * Get conversion data
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getConversionData = async (req, res) => {
  try {
    // Get conversion counts by day
    const conversions = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "convertedAt") as date,
        COUNT(*) as count,
        SUM("amount") as total_amount
      FROM "Conversion"
      WHERE "convertedAt" >= ${dayjs().subtract(30, 'day').toDate()}
      GROUP BY date
      ORDER BY date ASC
    `;
    
    // Format the conversion data
    const formattedConversions = conversions.map(item => ({
      date: dayjs(item.date).format('MMM DD'),
      count: parseInt(item.count, 10) || 0,
      totalAmount: parseFloat(item.total_amount) || 0
    }));
    
    return res.status(200).json({
      success: true,
      conversions: formattedConversions
    });
  } catch (error) {
    console.error('Error getting conversion data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting conversion data',
      error: error.message
    });
  }
};

/**
 * Export dashboard data as CSV
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.exportDashboardData = async (req, res) => {
  try {
    const { dataType } = req.params;
    let csvData = '';
    let filename = '';
    
    switch (dataType) {
      case 'leads':
        // Export leads data
        const leads = await prisma.lead.findMany({
          select: {
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
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        });
        
        // Create CSV header
        csvData = 'Lead ID,First Name,Last Name,Email,Phone,Status,Vehicle Year,Vehicle Make,City,State,ZIP,Savings,Created At\n';
        
        // Add lead data rows
        leads.forEach(lead => {
          csvData += `${lead.leadId},${lead.firstName},${lead.lastName || ''},${lead.email || ''},${lead.phone},${lead.status},${lead.vehicleYear || ''},${lead.vehicleMake || ''},${lead.city || ''},${lead.state || ''},${lead.zip || ''},${lead.savings || ''},${dayjs(lead.createdAt).format('YYYY-MM-DD HH:mm:ss')}\n`;
        });
        
        filename = `leads_export_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
        break;
        
      case 'messages':
        // Export messages data
        const messages = await prisma.message.findMany({
          include: {
            lead: {
              select: {
                leadId: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          },
          orderBy: { sentAt: 'desc' }
        });
        
        // Create CSV header
        csvData = 'Lead ID,First Name,Last Name,Phone,Direction,Status,Message Body,Sent At,Delivered At\n';
        
        // Add message data rows
        messages.forEach(message => {
          csvData += `${message.lead.leadId},${message.lead.firstName},${message.lead.lastName || ''},${message.lead.phone},${message.direction},${message.status},${message.body.replace(/,/g, ' ').replace(/\n/g, ' ')},${message.sentAt ? dayjs(message.sentAt).format('YYYY-MM-DD HH:mm:ss') : ''},${message.deliveredAt ? dayjs(message.deliveredAt).format('YYYY-MM-DD HH:mm:ss') : ''}\n`;
        });
        
        filename = `messages_export_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
        break;
        
      case 'conversions':
        // Export conversions data
        const conversions = await prisma.conversion.findMany({
          include: {
            lead: {
              select: {
                leadId: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          },
          orderBy: { convertedAt: 'desc' }
        });
        
        // Create CSV header
        csvData = 'Lead ID,First Name,Last Name,Phone,Conversion Type,Amount,Converted At\n';
        
        // Add conversion data rows
        conversions.forEach(conversion => {
          csvData += `${conversion.lead.leadId},${conversion.lead.firstName},${conversion.lead.lastName || ''},${conversion.lead.phone},${conversion.type || 'standard'},${conversion.amount || '0'},${dayjs(conversion.convertedAt).format('YYYY-MM-DD HH:mm:ss')}\n`;
        });
        
        filename = `conversions_export_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid data type. Must be one of: leads, messages, conversions'
        });
    }
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Send the CSV data
    return res.status(200).send(csvData);
  } catch (error) {
    console.error('Error exporting dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error exporting dashboard data',
      error: error.message
    });
  }
};
