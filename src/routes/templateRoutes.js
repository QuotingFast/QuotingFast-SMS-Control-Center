/**
 * Template Routes
 * 
 * Routes for managing SMS templates
 */

const express = require('express');
const { 
  getAllTemplates, 
  getTemplatesByDay, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} = require('../controllers/templateController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/templates
 * @desc    Get all SMS templates
 * @access  Private
 */
router.get('/', authMiddleware, getAllTemplates);

/**
 * @route   GET /api/templates/day/:day
 * @desc    Get templates for a specific day
 * @access  Private
 */
router.get('/day/:day', authMiddleware, getTemplatesByDay);

/**
 * @route   POST /api/templates
 * @desc    Create a new template
 * @access  Private
 */
router.post('/', authMiddleware, createTemplate);

/**
 * @route   PUT /api/templates/:id
 * @desc    Update an existing template
 * @access  Private
 */
router.put('/:id', authMiddleware, updateTemplate);

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete a template
 * @access  Private
 */
router.delete('/:id', authMiddleware, deleteTemplate);

module.exports = router;
