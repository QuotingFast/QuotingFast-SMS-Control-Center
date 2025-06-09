/**
 * User Routes
 * 
 * Routes for user authentication and management
 */

const express = require('express');
const { 
  register, 
  login, 
  getCurrentUser, 
  updateProfile,
  getAllUsers
} = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public (admin-only in production)
 */
router.post('/register', register);

/**
 * @route   POST /api/users/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/users/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, getCurrentUser);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', [authMiddleware, adminMiddleware], getAllUsers);

module.exports = router;
