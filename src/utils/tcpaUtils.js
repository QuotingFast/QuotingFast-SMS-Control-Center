/**
 * TCPA Compliance Utilities
 * 
 * Functions to ensure SMS messages are only sent during
 * TCPA-compliant hours (8 AM - 9 PM recipient's local time)
 */

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Configure dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Check if current time is within TCPA-compliant hours for a lead
 * 
 * @param {object} lead - The lead object with timezone information
 * @returns {boolean} - True if within TCPA hours, false otherwise
 */
exports.isWithinTcpaHours = async (lead) => {
  // Get TCPA hours from environment variables or use defaults
  const tcpaStartHour = parseInt(process.env.TCPA_START_HOUR || '8', 10);
  const tcpaEndHour = parseInt(process.env.TCPA_END_HOUR || '21', 10);
  
  // Get the lead's timezone or default to Eastern Time
  const leadTz = lead.timezone || 'America/New_York';
  
  // Get current time in lead's timezone
  const now = dayjs().tz(leadTz);
  const currentHour = now.hour();
  
  // Check if current hour is within TCPA hours
  return currentHour >= tcpaStartHour && currentHour < tcpaEndHour;
};

/**
 * Calculate the next valid sending time within TCPA hours
 * 
 * @param {object} lead - The lead object with timezone information
 * @returns {Date} - The next valid sending time
 */
exports.getNextValidSendingTime = (lead) => {
  // Get TCPA hours from environment variables or use defaults
  const tcpaStartHour = parseInt(process.env.TCPA_START_HOUR || '8', 10);
  const tcpaEndHour = parseInt(process.env.TCPA_END_HOUR || '21', 10);
  
  // Get the lead's timezone or default to Eastern Time
  const leadTz = lead.timezone || 'America/New_York';
  
  // Get current time in lead's timezone
  const now = dayjs().tz(leadTz);
  const currentHour = now.hour();
  
  let nextValidTime;
  
  if (currentHour >= tcpaEndHour) {
    // After end hour, schedule for start hour tomorrow
    nextValidTime = now.add(1, 'day').hour(tcpaStartHour).minute(0).second(0);
  } else if (currentHour < tcpaStartHour) {
    // Before start hour, schedule for start hour today
    nextValidTime = now.hour(tcpaStartHour).minute(0).second(0);
  } else {
    // Already within TCPA hours, can send now
    nextValidTime = now;
  }
  
  return nextValidTime.toDate();
};

/**
 * Check if a specific datetime is within TCPA-compliant hours
 * 
 * @param {Date} dateTime - The datetime to check
 * @param {string} timezone - The timezone to use
 * @returns {boolean} - True if within TCPA hours, false otherwise
 */
exports.isDateTimeWithinTcpaHours = (dateTime, timezone) => {
  // Get TCPA hours from environment variables or use defaults
  const tcpaStartHour = parseInt(process.env.TCPA_START_HOUR || '8', 10);
  const tcpaEndHour = parseInt(process.env.TCPA_END_HOUR || '21', 10);
  
  // Default to Eastern Time if no timezone provided
  const tz = timezone || 'America/New_York';
  
  // Convert the datetime to the specified timezone
  const localDateTime = dayjs(dateTime).tz(tz);
  const hour = localDateTime.hour();
  
  // Check if hour is within TCPA hours
  return hour >= tcpaStartHour && hour < tcpaEndHour;
};
