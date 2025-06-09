/**
 * SMS Utility Functions
 * 
 * Utilities for working with SMS messages, including truncation
 * to ensure messages stay within the 160 character limit
 */

/**
 * Truncate SMS content to ensure it stays within 160 bytes
 * while preserving the URL and opt-out text
 * 
 * @param {string} content - The SMS content to truncate
 * @returns {string} - The truncated SMS content
 */
exports.truncateSmsContent = (content) => {
  // Maximum SMS length in bytes
  const MAX_SMS_BYTES = 160;
  
  // Check if content is already within limit
  if (Buffer.byteLength(content, 'utf8') <= MAX_SMS_BYTES) {
    return content;
  }
  
  // Find the URL and opt-out portion to preserve
  const urlMatch = content.match(/(quotingfast\.io\/[a-zA-Z0-9]+)/);
  const optOutMatch = content.match(/(-QuotingFast STOP)/);
  
  if (!urlMatch || !optOutMatch) {
    // If we can't find URL or opt-out, just truncate to 157 chars and add "..."
    return content.substring(0, 157) + '...';
  }
  
  const url = urlMatch[0];
  const optOut = optOutMatch[0];
  
  // Calculate how much space we need to reserve for URL and opt-out
  const reservedPortion = url + ' ' + optOut;
  const reservedBytes = Buffer.byteLength(reservedPortion, 'utf8');
  
  // Calculate how many bytes we have left for the main content
  const availableBytes = MAX_SMS_BYTES - reservedBytes - 3; // 3 for "..."
  
  // Find where to split the content
  let mainContent = content.replace(url, '').replace(optOut, '');
  let truncatedMain = '';
  let byteCount = 0;
  
  // Truncate the main content by counting bytes
  for (let i = 0; i < mainContent.length; i++) {
    const char = mainContent[i];
    const charBytes = Buffer.byteLength(char, 'utf8');
    
    if (byteCount + charBytes <= availableBytes) {
      truncatedMain += char;
      byteCount += charBytes;
    } else {
      break;
    }
  }
  
  // Reconstruct the message with the URL and opt-out preserved
  const urlIndex = content.indexOf(url);
  const optOutIndex = content.indexOf(optOut);
  
  if (urlIndex < optOutIndex) {
    // URL comes before opt-out
    return truncatedMain.trim() + '... ' + url + ' ' + optOut;
  } else {
    // Opt-out comes before URL (unlikely but handling it)
    return truncatedMain.trim() + '... ' + optOut + ' ' + url;
  }
};

/**
 * Check if an SMS message is an opt-out request
 * 
 * @param {string} message - The message to check
 * @returns {boolean} - True if the message is an opt-out request
 */
exports.isOptOutMessage = (message) => {
  if (!message) return false;
  
  const optOutKeywords = [
    'stop', 
    'unsubscribe', 
    'cancel', 
    'end', 
    'quit', 
    'optout', 
    'opt out'
  ];
  
  const normalizedMessage = message.trim().toLowerCase();
  
  return optOutKeywords.some(keyword => 
    normalizedMessage === keyword || 
    normalizedMessage.startsWith(keyword + ' ') || 
    normalizedMessage.endsWith(' ' + keyword) ||
    normalizedMessage.includes(' ' + keyword + ' ')
  );
};

/**
 * Generate a random SMS template variant for a specific day
 * 
 * @param {number} day - The day in the sequence
 * @returns {number} - A random variant number (1-6)
 */
exports.getRandomVariant = () => {
  return Math.floor(Math.random() * 6) + 1; // Random number 1-6
};
