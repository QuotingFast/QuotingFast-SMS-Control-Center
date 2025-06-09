/**
 * Lead Routes
 * 
 * Routes for managing leads/contacts
 */

const express = require('express');
const { 
  getAllLeads, 
  getLeadById, 
  updateLeadStatus, 
  sendTestSms,
  getLeadStats
} = require('../controllers/leadController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/leads
 * @desc    Get all leads with pagination and filtering
 * @access  Private
 */
router.get('/', authMiddleware, getAllLeads);

/**
 * @route   GET /api/leads/stats
 * @desc    Get lead statistics for dashboard
 * @access  Private
 */
router.get('/stats', authMiddleware, getLeadStats);

/**
 * @route   GET /api/leads/:id
 * @desc    Get a single lead by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, getLeadById);

/**
 * @route   PUT /api/leads/:id/status
 * @desc    Update a lead's status
 * @access  Private
 */
router.put('/:id/status', authMiddleware, updateLeadStatus);

/**
 * @route   POST /api/leads/:id/test-sms
 * @desc    Send a test SMS to a lead
 * @access  Private
 */
router.post('/:id/test-sms', authMiddleware, sendTestSms);

module.exports = router;
