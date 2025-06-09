/**
 * Validation Utilities
 * 
 * Functions to validate incoming data
 */

/**
 * Validate lead data from webhook
 * @param {object} leadData - The lead data to validate
 * @returns {object} - Validation result with valid flag and errors
 */
exports.validateLeadData = (leadData) => {
  const errors = [];
  
  // Check required fields
  if (!leadData) {
    return { valid: false, errors: ['No lead data provided'] };
  }
  
  // First name is required
  if (!leadData.firstName) {
    errors.push('firstName is required');
  }
  
  // Phone number is required and must be valid
  if (!leadData.phone) {
    errors.push('phone is required');
  } else if (!isValidPhoneNumber(leadData.phone)) {
    errors.push('phone must be a valid phone number');
  }
  
  // Return validation result
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidPhoneNumber(phone) {
  // Strip all non-numeric characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // US phone numbers should be 10 digits (or 11 with country code)
  if (digitsOnly.length === 10) {
    return true;
  } else if (digitsOnly.length === 11 && digitsOnly.charAt(0) === '1') {
    return true;
  }
  
  return false;
}

/**
 * Validate SMS template
 * @param {object} template - The template to validate
 * @returns {object} - Validation result with valid flag and errors
 */
exports.validateSmsTemplate = (template) => {
  const errors = [];
  
  // Check required fields
  if (!template) {
    return { valid: false, errors: ['No template data provided'] };
  }
  
  // Day is required and must be one of the allowed values
  const allowedDays = [0, 1, 3, 5, 7, 10, 14, 21, 28];
  if (template.day === undefined || template.day === null) {
    errors.push('day is required');
  } else if (!allowedDays.includes(parseInt(template.day, 10))) {
    errors.push(`day must be one of: ${allowedDays.join(', ')}`);
  }
  
  // Variant is required and must be 1-6
  if (template.variant === undefined || template.variant === null) {
    errors.push('variant is required');
  } else {
    const variant = parseInt(template.variant, 10);
    if (isNaN(variant) || variant < 1 || variant > 6) {
      errors.push('variant must be a number between 1 and 6');
    }
  }
  
  // Body is required and must not be empty
  if (!template.body) {
    errors.push('body is required');
  } else if (template.body.trim() === '') {
    errors.push('body cannot be empty');
  } else if (Buffer.byteLength(template.body, 'utf8') > 160) {
    errors.push('body must be 160 bytes or less');
  }
  
  // Return validation result
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate custom SMS message
 * @param {object} message - The message data to validate
 * @returns {object} - Validation result with valid flag and errors
 */
exports.validateCustomMessage = (message) => {
  const errors = [];
  
  // Check required fields
  if (!message) {
    return { valid: false, errors: ['No message data provided'] };
  }
  
  // Lead ID is required
  if (!message.leadId) {
    errors.push('leadId is required');
  }
  
  // Body is required and must not be empty
  if (!message.body) {
    errors.push('body is required');
  } else if (message.body.trim() === '') {
    errors.push('body cannot be empty');
  } else if (Buffer.byteLength(message.body, 'utf8') > 160) {
    errors.push('body must be 160 bytes or less');
  }
  
  // Return validation result
  return {
    valid: errors.length === 0,
    errors
  };
};
