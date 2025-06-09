/**
 * Settings Controller
 * 
 * Handles operations related to system settings
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get all system settings
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    
    // Convert settings array to key-value object for easier client-side use
    const settingsObject = settings.reduce((obj, setting) => {
      obj[setting.key] = setting.value;
      return obj;
    }, {});
    
    return res.status(200).json({
      success: true,
      settings: settingsObject
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting settings',
      error: error.message
    });
  }
};

/**
 * Update a system setting
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required'
      });
    }
    
    // Check if setting exists
    const existingSetting = await prisma.setting.findUnique({
      where: { key }
    });
    
    let setting;
    
    if (existingSetting) {
      // Update existing setting
      setting = await prisma.setting.update({
        where: { key },
        data: { value }
      });
    } else {
      // Create new setting
      setting = await prisma.setting.create({
        data: { key, value }
      });
    }
    
    return res.status(200).json({
      success: true,
      setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating setting',
      error: error.message
    });
  }
};

/**
 * Update TCPA hours settings
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.updateTcpaHours = async (req, res) => {
  try {
    const { startHour, endHour } = req.body;
    
    // Validate hours
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      return res.status(400).json({
        success: false,
        message: 'Hours must be between 0 and 23'
      });
    }
    
    // Update start hour
    await prisma.setting.upsert({
      where: { key: 'TCPA_START_HOUR' },
      update: { value: startHour.toString() },
      create: { key: 'TCPA_START_HOUR', value: startHour.toString() }
    });
    
    // Update end hour
    await prisma.setting.upsert({
      where: { key: 'TCPA_END_HOUR' },
      update: { value: endHour.toString() },
      create: { key: 'TCPA_END_HOUR', value: endHour.toString() }
    });
    
    // Update environment variables in memory
    process.env.TCPA_START_HOUR = startHour.toString();
    process.env.TCPA_END_HOUR = endHour.toString();
    
    return res.status(200).json({
      success: true,
      message: 'TCPA hours updated successfully',
      tcpaHours: {
        startHour,
        endHour
      }
    });
  } catch (error) {
    console.error('Error updating TCPA hours:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating TCPA hours',
      error: error.message
    });
  }
};

/**
 * Get Twilio settings
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getTwilioSettings = async (req, res) => {
  try {
    // Get Twilio settings from database
    const accountSid = await prisma.setting.findUnique({
      where: { key: 'TWILIO_ACCOUNT_SID' }
    });
    
    const authToken = await prisma.setting.findUnique({
      where: { key: 'TWILIO_AUTH_TOKEN' }
    });
    
    const phoneNumber = await prisma.setting.findUnique({
      where: { key: 'TWILIO_PHONE_NUMBER' }
    });
    
    return res.status(200).json({
      success: true,
      twilioSettings: {
        accountSid: accountSid ? accountSid.value : null,
        // Don't return the full auth token for security
        authToken: authToken ? '••••••••' + authToken.value.slice(-4) : null,
        phoneNumber: phoneNumber ? phoneNumber.value : null
      }
    });
  } catch (error) {
    console.error('Error getting Twilio settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting Twilio settings',
      error: error.message
    });
  }
};

/**
 * Update Twilio settings
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.updateTwilioSettings = async (req, res) => {
  try {
    const { accountSid, authToken, phoneNumber } = req.body;
    
    // Update account SID
    if (accountSid) {
      await prisma.setting.upsert({
        where: { key: 'TWILIO_ACCOUNT_SID' },
        update: { value: accountSid },
        create: { key: 'TWILIO_ACCOUNT_SID', value: accountSid }
      });
      
      // Update environment variable in memory
      process.env.TWILIO_ACCOUNT_SID = accountSid;
    }
    
    // Update auth token
    if (authToken) {
      await prisma.setting.upsert({
        where: { key: 'TWILIO_AUTH_TOKEN' },
        update: { value: authToken },
        create: { key: 'TWILIO_AUTH_TOKEN', value: authToken }
      });
      
      // Update environment variable in memory
      process.env.TWILIO_AUTH_TOKEN = authToken;
    }
    
    // Update phone number
    if (phoneNumber) {
      await prisma.setting.upsert({
        where: { key: 'TWILIO_PHONE_NUMBER' },
        update: { value: phoneNumber },
        create: { key: 'TWILIO_PHONE_NUMBER', value: phoneNumber }
      });
      
      // Update environment variable in memory
      process.env.TWILIO_PHONE_NUMBER = phoneNumber;
    }
    
    return res.status(200).json({
      success: true,
      message: 'Twilio settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating Twilio settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating Twilio settings',
      error: error.message
    });
  }
};

/**
 * Initialize default settings if they don't exist
 */
exports.initializeDefaultSettings = async () => {
  try {
    console.log('Initializing default settings...');
    
    const defaultSettings = [
      { key: 'TCPA_START_HOUR', value: process.env.TCPA_START_HOUR || '8' },
      { key: 'TCPA_END_HOUR', value: process.env.TCPA_END_HOUR || '21' },
      { key: 'TWILIO_ACCOUNT_SID', value: process.env.TWILIO_ACCOUNT_SID || '' },
      { key: 'TWILIO_AUTH_TOKEN', value: process.env.TWILIO_AUTH_TOKEN || '' },
      { key: 'TWILIO_PHONE_NUMBER', value: process.env.TWILIO_PHONE_NUMBER || '' },
      { key: 'APP_URL', value: process.env.APP_URL || 'http://localhost:3000' },
      { key: 'REDIRECT_URL', value: process.env.REDIRECT_URL || 'http://localhost:3000/quote' }
    ];
    
    for (const setting of defaultSettings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {}, // Don't update if exists
        create: { key: setting.key, value: setting.value }
      });
    }
    
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
};
