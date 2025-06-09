/**
 * Redirect Routes
 * 
 * Routes for handling URL redirects and tracking click-throughs
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /r/:leadId
 * @desc    Track click and redirect to the actual quote page
 * @access  Public
 */
router.get('/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    
    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { leadId }
    });
    
    if (!lead) {
      return res.status(404).send('Quote not found');
    }
    
    // Record the click event
    await prisma.clickEvent.create({
      data: {
        leadId: lead.id,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip,
        referrer: req.headers.referer || ''
      }
    });
    
    // Construct the destination URL (this would be your actual quote page)
    const destinationUrl = `${process.env.APP_URL}/quote/${leadId}`;
    
    // Redirect to the destination
    return res.redirect(302, destinationUrl);
  } catch (error) {
    console.error('Error processing redirect:', error);
    return res.status(500).send('Error processing redirect');
  }
});

module.exports = router;
