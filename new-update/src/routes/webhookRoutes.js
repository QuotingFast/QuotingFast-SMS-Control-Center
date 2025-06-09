/**
 * Webhook Routes
 * 
 * Routes for handling incoming webhooks for leads and conversions
 */

const express = require('express');
const { processLeadWebhook, processConversionWebhook } = require('../controllers/webhookController');

const router = express.Router();

/**
 * @route   POST /webhook/lead
 * @desc    Process incoming lead webhook
 * @access  Public
 */
router.post('/lead', processLeadWebhook);

/**
 * @route   POST /webhook/conversion
 * @desc    Process conversion webhook
 * @access  Public
 */
router.post('/conversion', processConversionWebhook);

module.exports = router;
