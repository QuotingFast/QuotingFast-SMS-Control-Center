/**
 * Dashboard Routes
 * 
 * Routes for the reporting dashboard
 */

const express = require('express');
const { 
  getDashboardOverview, 
  getMessageActivity, 
  getConversionData,
  exportDashboardData
} = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview data
 * @access  Private
 */
router.get('/overview', authMiddleware, getDashboardOverview);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get message activity data for charts
 * @access  Private
 */
router.get('/activity', authMiddleware, getMessageActivity);

/**
 * @route   GET /api/dashboard/conversions
 * @desc    Get conversion data
 * @access  Private
 */
router.get('/conversions', authMiddleware, getConversionData);

/**
 * @route   GET /api/dashboard/export/:dataType
 * @desc    Export dashboard data as CSV
 * @access  Private
 */
router.get('/export/:dataType', authMiddleware, exportDashboardData);

module.exports = router;
