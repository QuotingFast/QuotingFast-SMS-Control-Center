/**
 * Settings Routes
 * 
 * Routes for managing system settings
 */

const express = require('express');
const { 
  getAllSettings, 
  updateSetting, 
  updateTcpaHours,
  getTwilioSettings,
  updateTwilioSettings
} = require('../controllers/settingsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/settings
 * @desc    Get all system settings
 * @access  Private
 */
router.get('/', authMiddleware, getAllSettings);

/**
 * @route   PUT /api/settings/:key
 * @desc    Update a system setting
 * @access  Private/Admin
 */
router.put('/:key', [authMiddleware, adminMiddleware], updateSetting);

/**
 * @route   PUT /api/settings/tcpa/hours
 * @desc    Update TCPA hours settings
 * @access  Private/Admin
 */
router.put('/tcpa/hours', [authMiddleware, adminMiddleware], updateTcpaHours);

/**
 * @route   GET /api/settings/twilio
 * @desc    Get Twilio settings
 * @access  Private/Admin
 */
router.get('/twilio', [authMiddleware, adminMiddleware], getTwilioSettings);

/**
 * @route   PUT /api/settings/twilio
 * @desc    Update Twilio settings
 * @access  Private/Admin
 */
router.put('/twilio', [authMiddleware, adminMiddleware], updateTwilioSettings);

module.exports = router;
