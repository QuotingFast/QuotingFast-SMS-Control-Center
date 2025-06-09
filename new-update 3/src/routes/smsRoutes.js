/**
 * SMS Routes
 * 
 * Routes for handling SMS-related operations
 */

const express = require('express');
const { 
  sendManualSms, 
  handleInboundSms, 
  getMessageHistory,
  getScheduledMessages
} = require('../controllers/smsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/sms/send
 * @desc    Send a manual SMS message
 * @access  Private
 */
router.post('/send', authMiddleware, sendManualSms);

/**
 * @route   POST /api/sms/inbound
 * @desc    Handle inbound SMS webhook from Twilio
 * @access  Public
 */
router.post('/inbound', handleInboundSms);

/**
 * @route   GET /api/sms/history/:leadId
 * @desc    Get message history for a lead
 * @access  Private
 */
router.get('/history/:leadId', authMiddleware, getMessageHistory);

/**
 * @route   GET /api/sms/scheduled/:leadId
 * @desc    Get scheduled messages for a lead
 * @access  Private
 */
router.get('/scheduled/:leadId', authMiddleware, getScheduledMessages);

module.exports = router;
