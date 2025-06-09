/**
 * Template Controller
 * 
 * Handles operations related to SMS templates
 */

const { PrismaClient } = require('@prisma/client');
const { validateSmsTemplate } = require('../utils/validators');

const prisma = new PrismaClient();

/**
 * Get all SMS templates
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await prisma.smsTemplate.findMany({
      orderBy: [
        { day: 'asc' },
        { variant: 'asc' }
      ]
    });
    
    return res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting templates',
      error: error.message
    });
  }
};

/**
 * Get templates for a specific day
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getTemplatesByDay = async (req, res) => {
  try {
    const { day } = req.params;
    
    const templates = await prisma.smsTemplate.findMany({
      where: { day: parseInt(day, 10) },
      orderBy: { variant: 'asc' }
    });
    
    return res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting templates by day:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting templates',
      error: error.message
    });
  }
};

/**
 * Create a new template
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.createTemplate = async (req, res) => {
  try {
    const { day, variant, body } = req.body;
    
    // Validate the template
    const validationResult = validateSmsTemplate({ day, variant, body });
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template data',
        errors: validationResult.errors
      });
    }
    
    // Check if template already exists
    const existingTemplate = await prisma.smsTemplate.findUnique({
      where: {
        day_variant: {
          day: parseInt(day, 10),
          variant: parseInt(variant, 10)
        }
      }
    });
    
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: `Template for day ${day}, variant ${variant} already exists`
      });
    }
    
    // Create the template
    const template = await prisma.smsTemplate.create({
      data: {
        day: parseInt(day, 10),
        variant: parseInt(variant, 10),
        body,
        active: true
      }
    });
    
    return res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating template',
      error: error.message
    });
  }
};

/**
 * Update an existing template
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { body, active } = req.body;
    
    // Find the template
    const template = await prisma.smsTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Validate the updated template
    if (body) {
      const validationResult = validateSmsTemplate({
        day: template.day,
        variant: template.variant,
        body
      });
      
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid template data',
          errors: validationResult.errors
        });
      }
    }
    
    // Update the template
    const updatedTemplate = await prisma.smsTemplate.update({
      where: { id },
      data: {
        body: body || template.body,
        active: active !== undefined ? active : template.active
      }
    });
    
    return res.status(200).json({
      success: true,
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating template',
      error: error.message
    });
  }
};

/**
 * Delete a template
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const template = await prisma.smsTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Check if template is being used in scheduled messages
    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: {
        templateId: id,
        status: 'PENDING'
      }
    });
    
    if (scheduledMessages.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete template that is being used in scheduled messages'
      });
    }
    
    // Delete the template
    await prisma.smsTemplate.delete({
      where: { id }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting template',
      error: error.message
    });
  }
};
