/**
 * Sanitize user input to prevent XSS attacks
 * This is a basic sanitization - for production, consider using DOMPurify library
 */

/**
 * Sanitize HTML string by escaping special characters
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeHTML = (str) => {
  if (typeof str !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Sanitize text input by removing potentially dangerous characters
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return '';

  // Remove any script tags and their content
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove any event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized.trim();
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();

  return emailRegex.test(sanitized) ? sanitized : null;
};

/**
 * Validate and sanitize phone number (10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {string|null} - Sanitized phone or null if invalid
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it's exactly 10 digits
  return digits.length === 10 ? digits : null;
};

/**
 * Sanitize username - alphanumeric and underscores only
 * @param {string} username - Username to sanitize
 * @returns {string} - Sanitized username
 */
export const sanitizeUsername = (username) => {
  if (typeof username !== 'string') return '';

  // Allow only alphanumeric characters and underscores
  return username.replace(/[^a-zA-Z0-9_]/g, '').trim();
};

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export const sanitizeURL = (url) => {
  if (typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Check for dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  // Ensure it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(trimmed);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return trimmed;
    }
  } catch (e) {
    // If URL parsing fails, it's not a valid URL
    return null;
  }

  return null;
};

/**
 * Sanitize bio/description text
 * Allows basic formatting but removes dangerous content
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeBio = (text) => {
  if (typeof text !== 'string') return '';

  // Remove script tags
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Limit length to prevent abuse
  const maxLength = 500;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Object with isValid boolean and message string
 */
export const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return { isValid: false, message: 'Password must be a string' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  return { isValid: true, message: 'Password is strong' };
};
