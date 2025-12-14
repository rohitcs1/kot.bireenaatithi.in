/**
 * Formatting Utilities
 * 
 * Helper functions for formatting currency, time, and generating IDs
 */

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'INR')
 * @param {string} locale - Locale string (default: 'en-IN')
 * @returns {string} - Formatted currency string
 * 
 * @example
 * formatCurrency(1250) // "₹1,250.00"
 * formatCurrency(1250, 'USD', 'en-US') // "$1,250.00"
 */
export const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `₹${parseFloat(amount).toFixed(2)}`;
  }
};

/**
 * Format time/date
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format type ('time', 'date', 'datetime', 'relative')
 * @returns {string} - Formatted time string
 * 
 * @example
 * formatTime(new Date(), 'time') // "2:30 PM"
 * formatTime(new Date(), 'date') // "Jan 15, 2024"
 * formatTime(new Date(), 'datetime') // "Jan 15, 2024, 2:30 PM"
 * formatTime(new Date(Date.now() - 60000), 'relative') // "1 minute ago"
 */
export const formatTime = (date, format = 'datetime') => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffMs = now - dateObj;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  switch (format) {
    case 'time':
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

    case 'date':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

    case 'datetime':
      return dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

    case 'relative':
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 minute ago';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

    default:
      return dateObj.toLocaleString('en-US');
  }
};

/**
 * Generate KOT (Kitchen Order Ticket) number
 * @param {string} prefix - Prefix for KOT number (default: 'KOT')
 * @param {number} length - Length of numeric part (default: 6)
 * @returns {string} - Generated KOT number
 * 
 * @example
 * generateKOTNumber() // "KOT-123456"
 * generateKOTNumber('ORD', 8) // "ORD-12345678"
 */
export const generateKOTNumber = (prefix = 'KOT', length = 6) => {
  // Generate random number with specified length
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Alternative: Use timestamp-based generation
  // const timestamp = Date.now().toString().slice(-length);
  // return `${prefix}-${timestamp}`;
  
  return `${prefix}-${randomNum}`;
};

/**
 * Format phone number
 * @param {string} phone - Phone number string
 * @param {string} format - Format type ('international', 'local')
 * @returns {string} - Formatted phone number
 * 
 * @example
 * formatPhoneNumber('1234567890') // "+91 12345 67890"
 */
export const formatPhoneNumber = (phone, format = 'international') => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'international' && cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

/**
 * Format table number
 * @param {string|number} tableNumber - Table number
 * @returns {string} - Formatted table number
 * 
 * @example
 * formatTableNumber(1) // "T-01"
 * formatTableNumber('5') // "T-05"
 */
export const formatTableNumber = (tableNumber) => {
  if (!tableNumber) return '';
  
  const num = typeof tableNumber === 'string' ? tableNumber.replace(/\D/g, '') : tableNumber.toString();
  return `T-${num.padStart(2, '0')}`;
};

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix for truncated text (default: '...')
 * @returns {string} - Truncated text
 * 
 * @example
 * truncateText('Very long text here', 10) // "Very long ..."
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + suffix;
};

export default {
  formatCurrency,
  formatTime,
  generateKOTNumber,
  formatPhoneNumber,
  formatTableNumber,
  truncateText
};

